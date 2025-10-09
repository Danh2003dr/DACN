// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DrugTraceability {
    // Struct cho thông tin lô thuốc
    struct DrugBatch {
        string drugId;
        string name;
        string activeIngredient;
        string manufacturerId;
        string batchNumber;
        uint256 productionDate;
        uint256 expiryDate;
        string qualityTestResult;
        string qrCodeData;
        address createdBy;
        uint256 createdAt;
        bool isActive;
        bool isRecalled;
        string recallReason;
        uint256 recallDate;
    }
    
    // Struct cho lịch sử phân phối
    struct DistributionRecord {
        address from;
        address to;
        uint256 timestamp;
        string location;
        string status;
        string notes;
    }
    
    // Mapping lưu trữ thông tin lô thuốc
    mapping(string => DrugBatch) public drugBatches;
    
    // Mapping lưu trữ lịch sử phân phối
    mapping(string => DistributionRecord[]) public distributionHistory;
    
    // Array lưu trữ tất cả drug IDs
    string[] public allDrugIds;
    
    // Owner của contract
    address public owner;
    
    // Events
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
    
    // Modifier chỉ cho phép owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Chỉ owner mới có quyền thực hiện");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
    }
    
    // Tạo lô thuốc mới
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
        require(bytes(_drugId).length > 0, "Drug ID không được để trống");
        require(drugBatches[_drugId].createdAt == 0, "Drug ID đã tồn tại");
        require(_expiryDate > _productionDate, "Hạn sử dụng phải sau ngày sản xuất");
        
        drugBatches[_drugId] = DrugBatch({
            drugId: _drugId,
            name: _name,
            activeIngredient: _activeIngredient,
            manufacturerId: _manufacturerId,
            batchNumber: _batchNumber,
            productionDate: _productionDate,
            expiryDate: _expiryDate,
            qualityTestResult: _qualityTestResult,
            qrCodeData: _qrCodeData,
            createdBy: msg.sender,
            createdAt: block.timestamp,
            isActive: true,
            isRecalled: false,
            recallReason: "",
            recallDate: 0
        });
        
        allDrugIds.push(_drugId);
        
        emit DrugBatchCreated(_drugId, _name, msg.sender, block.timestamp);
    }
    
    // Cập nhật thông tin lô thuốc
    function updateDrugBatch(
        string memory _drugId,
        string memory _name,
        string memory _activeIngredient,
        string memory _qualityTestResult
    ) external onlyOwner {
        require(drugBatches[_drugId].createdAt > 0, "Drug ID không tồn tại");
        
        drugBatches[_drugId].name = _name;
        drugBatches[_drugId].activeIngredient = _activeIngredient;
        drugBatches[_drugId].qualityTestResult = _qualityTestResult;
        
        emit DrugBatchUpdated(_drugId, msg.sender, block.timestamp);
    }
    
    // Thu hồi lô thuốc
    function recallDrugBatch(
        string memory _drugId,
        string memory _reason
    ) external onlyOwner {
        require(drugBatches[_drugId].createdAt > 0, "Drug ID không tồn tại");
        
        drugBatches[_drugId].isRecalled = true;
        drugBatches[_drugId].recallReason = _reason;
        drugBatches[_drugId].recallDate = block.timestamp;
        
        emit DrugBatchRecalled(_drugId, _reason, msg.sender, block.timestamp);
    }
    
    // Ghi nhận phân phối
    function recordDistribution(
        string memory _drugId,
        address _to,
        string memory _location,
        string memory _status,
        string memory _notes
    ) external onlyOwner {
        require(drugBatches[_drugId].createdAt > 0, "Drug ID không tồn tại");
        require(!drugBatches[_drugId].isRecalled, "Lô thuốc đã bị thu hồi");
        
        distributionHistory[_drugId].push(DistributionRecord({
            from: msg.sender,
            to: _to,
            timestamp: block.timestamp,
            location: _location,
            status: _status,
            notes: _notes
        }));
        
        emit DistributionRecorded(_drugId, msg.sender, _to, block.timestamp);
    }
    
    // Lấy thông tin lô thuốc
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
            batch.productionDate,
            batch.expiryDate,
            batch.qualityTestResult,
            batch.qrCodeData,
            batch.createdBy,
            batch.createdAt,
            batch.isActive,
            batch.isRecalled,
            batch.recallReason,
            batch.recallDate
        );
    }
    
    // Lấy lịch sử phân phối
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
        
        for (uint256 i = 0; i < length; i++) {
            froms[i] = records[i].from;
            tos[i] = records[i].to;
            timestamps[i] = records[i].timestamp;
            locations[i] = records[i].location;
            statuses[i] = records[i].status;
            notes[i] = records[i].notes;
        }
        
        return (froms, tos, timestamps, locations, statuses, notes);
    }
    
    // Lấy tổng số lô thuốc
    function getTotalDrugBatches() external view returns (uint256) {
        return allDrugIds.length;
    }
    
    // Kiểm tra lô thuốc có tồn tại không
    function drugBatchExists(string memory _drugId) external view returns (bool) {
        return drugBatches[_drugId].createdAt > 0;
    }
    
    // Lấy tất cả drug IDs
    function getAllDrugIds() external view returns (string[] memory) {
        return allDrugIds;
    }
}
