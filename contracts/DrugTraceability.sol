// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Custom errors để tiết kiệm gas (rẻ hơn require với string)
error DrugIdEmpty();
error DrugIdExists();
error InvalidExpiryDate();
error DrugNotFound();
error DrugRecalled();
error Unauthorized();
error SignatureIdEmpty();
error DataHashEmpty();

contract DrugTraceability {
    // Packed struct để tiết kiệm storage slots
    struct DrugBatch {
        address createdBy;           // 20 bytes
        uint64 productionDate;       // 8 bytes
        uint64 expiryDate;           // 8 bytes
        uint64 createdAt;            // 8 bytes
        uint64 recallDate;           // 8 bytes
        bool isActive;               // 1 byte
        bool isRecalled;             // 1 byte
        // Total: 54 bytes, fits in 2 slots (64 bytes)
        string drugId;               // Slot 3
        string name;                 // Slot 4+
        string activeIngredient;     // Slot 5+
        string manufacturerId;       // Slot 6+
        string batchNumber;          // Slot 7+
        string qualityTestResult;    // Slot 8+
        string qrCodeData;           // Slot 9+
        string recallReason;         // Slot 10+
    }
    
    // Packed struct cho lịch sử phân phối
    struct DistributionRecord {
        address from;                // 20 bytes
        address to;                  // 20 bytes
        uint64 timestamp;            // 8 bytes
        // Total: 48 bytes, fits in 1 slot
        string location;             // Slot 2+
        string status;               // Slot 3+
        string notes;                // Slot 4+
    }
    
    // Struct cho chữ ký số
    struct DigitalSignature {
        address signedBy;            // 20 bytes
        uint64 timestamp;            // 8 bytes
        // Total: 28 bytes
        string signatureId;          // Slot 2+
        string targetType;           // Slot 3+
        string targetId;             // Slot 4+
        string dataHash;             // Slot 5+ (SHA-256 hash)
        string signature;            // Slot 6+ (chữ ký số)
        string certificateSerialNumber; // Slot 7+
    }
    
    // Mapping lưu trữ thông tin lô thuốc
    mapping(string => DrugBatch) public drugBatches;
    
    // Mapping lưu trữ lịch sử phân phối
    mapping(string => DistributionRecord[]) public distributionHistory;
    
    // Mapping lưu trữ chữ ký số
    // Key: signatureId (unique identifier cho chữ ký)
    mapping(string => DigitalSignature) public digitalSignatures;
    
    // Mapping để lưu danh sách signature IDs theo target (drugId, supplyChainId, etc.)
    mapping(string => string[]) public targetSignatures;
    
    // Array lưu trữ tất cả drug IDs (tối ưu hóa bằng cách sử dụng mapping)
    string[] public allDrugIds;
    mapping(string => uint256) private drugIdIndex; // Index của drugId trong array
    
    // Owner của contract
    address public owner;
    
    // Batch size limit để tránh gas limit
    uint256 public constant MAX_BATCH_SIZE = 50;
    
    // Events với indexed parameters để tiết kiệm gas
    event DrugBatchCreated(
        string indexed drugId,
        string name,
        address indexed createdBy,
        uint256 timestamp
    );
    
    event DrugBatchUpdated(
        string indexed drugId,
        address indexed updatedBy,
        uint256 timestamp
    );
    
    event DrugBatchRecalled(
        string indexed drugId,
        string reason,
        address indexed recalledBy,
        uint256 timestamp
    );
    
    event DistributionRecorded(
        string indexed drugId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    
    event DrugBatchVerified(
        string indexed drugId,
        address indexed verifier,
        bool isValid,
        uint256 timestamp
    );
    
    event DigitalSignatureRecorded(
        string indexed signatureId,
        string indexed targetType,
        string indexed targetId,
        address signedBy,
        string dataHash,
        uint256 timestamp
    );
    
    // Modifier chỉ cho phép owner
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
    }
    
    // Tạo lô thuốc mới (tối ưu hóa)
    function createDrugBatch(
        string memory _drugId,
        string memory _name,
        string memory _activeIngredient,
        string memory _manufacturerId,
        string memory _batchNumber,
        uint256 _productionDate,
        uint256 _expiryDate,
        string memory _qualityTestResult,
        string memory _qrCodeData
    ) external onlyOwner {
        if (bytes(_drugId).length == 0) revert DrugIdEmpty();
        if (drugBatches[_drugId].createdAt > 0) revert DrugIdExists();
        if (_expiryDate <= _productionDate) revert InvalidExpiryDate();
        
        drugBatches[_drugId] = DrugBatch({
            drugId: _drugId,
            name: _name,
            activeIngredient: _activeIngredient,
            manufacturerId: _manufacturerId,
            batchNumber: _batchNumber,
            productionDate: uint64(_productionDate),
            expiryDate: uint64(_expiryDate),
            qualityTestResult: _qualityTestResult,
            qrCodeData: _qrCodeData,
            createdBy: msg.sender,
            createdAt: uint64(block.timestamp),
            isActive: true,
            isRecalled: false,
            recallReason: "",
            recallDate: 0
        });
        
        allDrugIds.push(_drugId);
        drugIdIndex[_drugId] = allDrugIds.length; // Index + 1 (0 = không tồn tại)
        
        emit DrugBatchCreated(_drugId, _name, msg.sender, block.timestamp);
    }
    
    // Batch create để tiết kiệm gas khi tạo nhiều lô thuốc
    function createDrugBatchBatch(
        string[] memory _drugIds,
        string[] memory _names,
        string[] memory _activeIngredients,
        string[] memory _manufacturerIds,
        string[] memory _batchNumbers,
        uint256[] memory _productionDates,
        uint256[] memory _expiryDates,
        string[] memory _qualityTestResults,
        string[] memory _qrCodeData
    ) external onlyOwner {
        require(_drugIds.length == _names.length && 
                _drugIds.length == _activeIngredients.length &&
                _drugIds.length <= MAX_BATCH_SIZE, "Invalid batch size");
        
        for (uint256 i = 0; i < _drugIds.length; i++) {
            if (bytes(_drugIds[i]).length == 0) continue;
            if (drugBatches[_drugIds[i]].createdAt > 0) continue;
            if (_expiryDates[i] <= _productionDates[i]) continue;
            
            drugBatches[_drugIds[i]] = DrugBatch({
                drugId: _drugIds[i],
                name: _names[i],
                activeIngredient: _activeIngredients[i],
                manufacturerId: _manufacturerIds[i],
                batchNumber: _batchNumbers[i],
                productionDate: uint64(_productionDates[i]),
                expiryDate: uint64(_expiryDates[i]),
                qualityTestResult: _qualityTestResults[i],
                qrCodeData: _qrCodeData[i],
                createdBy: msg.sender,
                createdAt: uint64(block.timestamp),
                isActive: true,
                isRecalled: false,
                recallReason: "",
                recallDate: 0
            });
            
            allDrugIds.push(_drugIds[i]);
            drugIdIndex[_drugIds[i]] = allDrugIds.length;
            
            emit DrugBatchCreated(_drugIds[i], _names[i], msg.sender, block.timestamp);
        }
    }
    
    // Cập nhật thông tin lô thuốc (tối ưu hóa)
    function updateDrugBatch(
        string memory _drugId,
        string memory _name,
        string memory _activeIngredient,
        string memory _qualityTestResult
    ) external onlyOwner {
        if (drugBatches[_drugId].createdAt == 0) revert DrugNotFound();
        
        drugBatches[_drugId].name = _name;
        drugBatches[_drugId].activeIngredient = _activeIngredient;
        drugBatches[_drugId].qualityTestResult = _qualityTestResult;
        
        emit DrugBatchUpdated(_drugId, msg.sender, block.timestamp);
    }
    
    // Thu hồi lô thuốc (tối ưu hóa)
    function recallDrugBatch(
        string memory _drugId,
        string memory _reason
    ) external onlyOwner {
        if (drugBatches[_drugId].createdAt == 0) revert DrugNotFound();
        
        drugBatches[_drugId].isRecalled = true;
        drugBatches[_drugId].recallReason = _reason;
        drugBatches[_drugId].recallDate = uint64(block.timestamp);
        
        emit DrugBatchRecalled(_drugId, _reason, msg.sender, block.timestamp);
    }
    
    // Ghi nhận phân phối (tối ưu hóa)
    function recordDistribution(
        string memory _drugId,
        address _to,
        string memory _location,
        string memory _status,
        string memory _notes
    ) external onlyOwner {
        if (drugBatches[_drugId].createdAt == 0) revert DrugNotFound();
        if (drugBatches[_drugId].isRecalled) revert DrugRecalled();
        
        distributionHistory[_drugId].push(DistributionRecord({
            from: msg.sender,
            to: _to,
            timestamp: uint64(block.timestamp),
            location: _location,
            status: _status,
            notes: _notes
        }));
        
        emit DistributionRecorded(_drugId, msg.sender, _to, block.timestamp);
    }
    
    // Batch record distribution để tiết kiệm gas
    function recordDistributionBatch(
        string memory _drugId,
        address[] memory _toAddresses,
        string[] memory _locations,
        string[] memory _statuses,
        string[] memory _notes
    ) external onlyOwner {
        if (drugBatches[_drugId].createdAt == 0) revert DrugNotFound();
        if (drugBatches[_drugId].isRecalled) revert DrugRecalled();
        require(_toAddresses.length == _locations.length && 
                _toAddresses.length <= MAX_BATCH_SIZE, "Invalid batch size");
        
        for (uint256 i = 0; i < _toAddresses.length; i++) {
            distributionHistory[_drugId].push(DistributionRecord({
                from: msg.sender,
                to: _toAddresses[i],
                timestamp: uint64(block.timestamp),
                location: _locations[i],
                status: _statuses[i],
                notes: _notes[i]
            }));
            
            emit DistributionRecorded(_drugId, msg.sender, _toAddresses[i], block.timestamp);
        }
    }
    
    // Lấy thông tin lô thuốc (tối ưu hóa return)
    function getDrugBatch(string memory _drugId) external view returns (
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        uint256,
        uint256,
        string memory,
        string memory,
        address,
        uint256,
        bool,
        bool,
        string memory,
        uint256
    ) {
        DrugBatch memory batch = drugBatches[_drugId];
        return (
            batch.drugId,
            batch.name,
            batch.activeIngredient,
            batch.manufacturerId,
            batch.batchNumber,
            uint256(batch.productionDate),
            uint256(batch.expiryDate),
            batch.qualityTestResult,
            batch.qrCodeData,
            batch.createdBy,
            uint256(batch.createdAt),
            batch.isActive,
            batch.isRecalled,
            batch.recallReason,
            uint256(batch.recallDate)
        );
    }
    
    // Lấy lịch sử phân phối (tối ưu hóa)
    function getDistributionHistory(string memory _drugId) external view returns (
        address[] memory,
        address[] memory,
        uint256[] memory,
        string[] memory,
        string[] memory,
        string[] memory
    ) {
        DistributionRecord[] memory records = distributionHistory[_drugId];
        uint256 length = records.length;
        
        address[] memory froms = new address[](length);
        address[] memory tos = new address[](length);
        uint256[] memory timestamps = new uint256[](length);
        string[] memory locations = new string[](length);
        string[] memory statuses = new string[](length);
        string[] memory notes = new string[](length);
        
        // Unchecked loop để tiết kiệm gas (đã kiểm tra length)
        unchecked {
            for (uint256 i = 0; i < length; i++) {
                froms[i] = records[i].from;
                tos[i] = records[i].to;
                timestamps[i] = uint256(records[i].timestamp);
                locations[i] = records[i].location;
                statuses[i] = records[i].status;
                notes[i] = records[i].notes;
            }
        }
        
        return (froms, tos, timestamps, locations, statuses, notes);
    }
    
    // Lấy tổng số lô thuốc
    function getTotalDrugBatches() external view returns (uint256) {
        return allDrugIds.length;
    }
    
    // Kiểm tra lô thuốc có tồn tại không (tối ưu hóa)
    function drugBatchExists(string memory _drugId) external view returns (bool) {
        return drugBatches[_drugId].createdAt > 0;
    }
    
    // Lấy tất cả drug IDs (tối ưu hóa với pagination)
    function getAllDrugIds() external view returns (string[] memory) {
        return allDrugIds;
    }
    
    // Lấy drug IDs với pagination để tránh gas limit
    function getDrugIdsPaginated(uint256 _offset, uint256 _limit) external view returns (
        string[] memory drugIds,
        uint256 total
    ) {
        total = allDrugIds.length;
        if (_offset >= total) {
            return (new string[](0), total);
        }
        
        uint256 end = _offset + _limit;
        if (end > total) {
            end = total;
        }
        
        uint256 length = end - _offset;
        drugIds = new string[](length);
        
        unchecked {
            for (uint256 i = 0; i < length; i++) {
                drugIds[i] = allDrugIds[_offset + i];
            }
        }
        
        return (drugIds, total);
    }
    
    // Kiểm tra tính hợp lệ của lô thuốc (tối ưu hóa)
    function verifyDrugBatch(string memory _drugId) external view returns (
        bool isValid,
        bool isExpired,
        bool isRecalled,
        string memory status
    ) {
        DrugBatch memory batch = drugBatches[_drugId];
        
        if (batch.createdAt == 0) {
            return (false, false, false, "Not Found");
        }
        
        bool expired = block.timestamp > uint256(batch.expiryDate);
        bool recalled = batch.isRecalled;
        
        string memory currentStatus;
        if (recalled) {
            currentStatus = "Recalled";
        } else if (expired) {
            currentStatus = "Expired";
        } else {
            currentStatus = "Valid";
        }
        
        return (!recalled && !expired, expired, recalled, currentStatus);
    }
    
    // Lấy thống kê tổng quan (tối ưu hóa với unchecked)
    function getContractStats() external view returns (
        uint256 totalBatches,
        uint256 activeBatches,
        uint256 recalledBatches,
        uint256 expiredBatches
    ) {
        totalBatches = allDrugIds.length;
        uint256 active = 0;
        uint256 recalled = 0;
        uint256 expired = 0;
        
        unchecked {
            for (uint256 i = 0; i < allDrugIds.length; i++) {
                DrugBatch memory batch = drugBatches[allDrugIds[i]];
                
                if (batch.isRecalled) {
                    recalled++;
                } else if (block.timestamp > uint256(batch.expiryDate)) {
                    expired++;
                } else {
                    active++;
                }
            }
        }
        
        return (totalBatches, active, recalled, expired);
    }
    
    // Tìm kiếm lô thuốc theo tên (tối ưu hóa)
    function searchDrugBatchesByName(string memory _name) external view returns (string[] memory) {
        string[] memory results = new string[](allDrugIds.length);
        uint256 count = 0;
        bytes32 nameHash = keccak256(bytes(_name));
        
        unchecked {
            for (uint256 i = 0; i < allDrugIds.length; i++) {
                DrugBatch memory batch = drugBatches[allDrugIds[i]];
                if (keccak256(bytes(batch.name)) == nameHash) {
                    results[count] = allDrugIds[i];
                    count++;
                }
            }
        }
        
        // Tạo array với kích thước chính xác
        string[] memory finalResults = new string[](count);
        unchecked {
            for (uint256 i = 0; i < count; i++) {
                finalResults[i] = results[i];
            }
        }
        
        return finalResults;
    }
    
    // Lấy lịch sử phân phối với pagination (tối ưu hóa)
    function getDistributionHistoryPaginated(
        string memory _drugId,
        uint256 _offset,
        uint256 _limit
    ) external view returns (
        address[] memory,
        address[] memory,
        uint256[] memory,
        string[] memory,
        string[] memory,
        string[] memory,
        uint256 totalRecords
    ) {
        DistributionRecord[] memory records = distributionHistory[_drugId];
        uint256 total = records.length;
        
        if (_offset >= total) {
            address[] memory emptyAddresses = new address[](0);
            string[] memory emptyStrings = new string[](0);
            uint256[] memory emptyUints = new uint256[](0);
            return (emptyAddresses, emptyAddresses, emptyUints, emptyStrings, emptyStrings, emptyStrings, total);
        }
        
        uint256 end = _offset + _limit;
        if (end > total) {
            end = total;
        }
        
        uint256 length = end - _offset;
        
        address[] memory froms = new address[](length);
        address[] memory tos = new address[](length);
        uint256[] memory timestamps = new uint256[](length);
        string[] memory locations = new string[](length);
        string[] memory statuses = new string[](length);
        string[] memory notes = new string[](length);
        
        unchecked {
            for (uint256 i = 0; i < length; i++) {
                uint256 index = _offset + i;
                froms[i] = records[index].from;
                tos[i] = records[index].to;
                timestamps[i] = uint256(records[index].timestamp);
                locations[i] = records[index].location;
                statuses[i] = records[index].status;
                notes[i] = records[index].notes;
            }
        }
        
        return (froms, tos, timestamps, locations, statuses, notes, total);
    }
    
    // Function để ghi nhận việc xác minh
    function recordVerification(string memory _drugId, bool _isValid) external {
        if (drugBatches[_drugId].createdAt == 0) revert DrugNotFound();
        
        emit DrugBatchVerified(_drugId, msg.sender, _isValid, block.timestamp);
    }
    
    // Ghi chữ ký số lên blockchain
    function recordDigitalSignature(
        string memory _signatureId,
        string memory _targetType,
        string memory _targetId,
        string memory _dataHash,
        string memory _signature,
        string memory _certificateSerialNumber
    ) external onlyOwner {
        if (bytes(_signatureId).length == 0) revert SignatureIdEmpty();
        if (bytes(_dataHash).length == 0) revert DataHashEmpty();
        
        // Lưu chữ ký số
        digitalSignatures[_signatureId] = DigitalSignature({
            signedBy: msg.sender,
            timestamp: uint64(block.timestamp),
            signatureId: _signatureId,
            targetType: _targetType,
            targetId: _targetId,
            dataHash: _dataHash,
            signature: _signature,
            certificateSerialNumber: _certificateSerialNumber
        });
        
        // Thêm vào danh sách signatures của target
        targetSignatures[_targetId].push(_signatureId);
        
        emit DigitalSignatureRecorded(
            _signatureId,
            _targetType,
            _targetId,
            msg.sender,
            _dataHash,
            block.timestamp
        );
    }
    
    // Lấy thông tin chữ ký số
    function getDigitalSignature(string memory _signatureId) external view returns (
        address signedBy,
        uint256 timestamp,
        string memory signatureId,
        string memory targetType,
        string memory targetId,
        string memory dataHash,
        string memory signature,
        string memory certificateSerialNumber
    ) {
        DigitalSignature memory sig = digitalSignatures[_signatureId];
        if (bytes(sig.signatureId).length == 0) revert();
        
        return (
            sig.signedBy,
            uint256(sig.timestamp),
            sig.signatureId,
            sig.targetType,
            sig.targetId,
            sig.dataHash,
            sig.signature,
            sig.certificateSerialNumber
        );
    }
    
    // Lấy danh sách signature IDs của một target
    function getTargetSignatures(string memory _targetId) external view returns (string[] memory) {
        return targetSignatures[_targetId];
    }
    
    // Kiểm tra chữ ký số có tồn tại không
    function digitalSignatureExists(string memory _signatureId) external view returns (bool) {
        return bytes(digitalSignatures[_signatureId].signatureId).length > 0;
    }
}
