const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Drug = require('../models/Drug');
const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Supplier = require('../models/Supplier');
const Contract = require('../models/Contract');
const SupplyChain = require('../models/SupplyChain');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const DigitalSignature = require('../models/DigitalSignature');
const SupplierTrustScore = require('../models/SupplierTrustScore');
const AuditLog = require('../models/AuditLog');
const Backup = require('../models/Backup');

/**
 * Script tổng hợp để tạo dữ liệu thật cho tất cả các tài khoản phân quyền
 * Bao gồm tất cả các module đã phát triển
 */
async function seedRealDataAllRoles() {
  try {
    console.log('🚀 Bắt đầu tạo dữ liệu thật cho tất cả tài khoản phân quyền...\n');

    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Đã kết nối MongoDB\n');

    // Xóa dữ liệu cũ (nếu có)
    console.log('🗑️  Xóa dữ liệu cũ...');
    await User.deleteMany({});
    await Drug.deleteMany({});
    await Inventory.deleteMany({});
    await InventoryTransaction.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
    await Supplier.deleteMany({});
    await Contract.deleteMany({});
    await SupplyChain.deleteMany({});
    await Task.deleteMany({});
    await Notification.deleteMany({});
    await Review.deleteMany({});
    await DigitalSignature.deleteMany({});
    await SupplierTrustScore.deleteMany({});
    await AuditLog.deleteMany({});
    await Backup.deleteMany({});
    console.log('  ✅ Đã xóa dữ liệu cũ\n');

    // Mật khẩu mặc định (sẽ được middleware User tự động hash)
    const defaultPassword = 'default123';

    // ========== 1. TẠO USERS VỚI CÁC ROLE PHÂN QUYỀN ==========
    console.log('👥 1. Tạo users với các role phân quyền...');
    
    const users = [];
    
    // Admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: defaultPassword,
      fullName: 'Quản trị viên hệ thống',
      phone: '0123456789',
      address: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
      role: 'admin',
      isActive: true,
      mustChangePassword: true
    });
    users.push(admin);
    console.log('  ✅ Đã tạo admin');

    // Manufacturers (3 nhà sản xuất)
    const manufacturerNames = [
      { name: 'Công ty Dược phẩm ABC', orgId: 'MFG_001', city: 'TP.HCM' },
      { name: 'Nhà máy Dược phẩm XYZ', orgId: 'MFG_002', city: 'Hà Nội' },
      { name: 'Công ty Sản xuất Thuốc DEF', orgId: 'MFG_003', city: 'Đà Nẵng' }
    ];

    for (let i = 0; i < manufacturerNames.length; i++) {
      const mfg = manufacturerNames[i];
      const manufacturer = await User.create({
        username: `manufacturer${i + 1}`,
        email: `manufacturer${i + 1}@example.com`,
        password: defaultPassword,
        fullName: mfg.name,
        phone: `09${String(i + 1).padStart(8, '0')}`,
        address: `${100 + i * 50} Đường ${mfg.city}, Phường ${i + 1}, Quận ${i + 1}, ${mfg.city}`,
        role: 'manufacturer',
        organizationId: mfg.orgId,
        organizationInfo: {
          name: mfg.name,
          license: `LIC_${mfg.orgId}`,
          type: 'pharmaceutical_company',
          description: `Nhà sản xuất thuốc uy tín tại ${mfg.city}`
        },
        isActive: true,
        mustChangePassword: true
      });
      users.push(manufacturer);
    }
    console.log(`  ✅ Đã tạo ${manufacturerNames.length} manufacturers`);

    // Distributors (3 nhà phân phối)
    const distributorNames = [
      { name: 'Công ty Phân phối Dược phẩm GHI', orgId: 'DIST_001', city: 'TP.HCM' },
      { name: 'Trung tâm Phân phối Thuốc JKL', orgId: 'DIST_002', city: 'Hà Nội' },
      { name: 'Công ty Phân phối MNO', orgId: 'DIST_003', city: 'Cần Thơ' }
    ];

    for (let i = 0; i < distributorNames.length; i++) {
      const dist = distributorNames[i];
      const distributor = await User.create({
        username: `distributor${i + 1}`,
        email: `distributor${i + 1}@example.com`,
        password: defaultPassword,
        fullName: dist.name,
        phone: `08${String(i + 1).padStart(8, '0')}`,
        address: `${200 + i * 50} Đường ${dist.city}, Phường ${i + 2}, Quận ${i + 2}, ${dist.city}`,
        role: 'distributor',
        organizationId: dist.orgId,
        organizationInfo: {
          name: dist.name,
          license: `LIC_${dist.orgId}`,
          type: 'distribution_company',
          description: `Nhà phân phối thuốc chuyên nghiệp tại ${dist.city}`
        },
        isActive: true,
        mustChangePassword: true
      });
      users.push(distributor);
    }
    console.log(`  ✅ Đã tạo ${distributorNames.length} distributors`);

    // Hospitals (3 bệnh viện)
    const hospitalNames = [
      { name: 'Bệnh viện Chợ Rẫy', orgId: 'HOSP_001', city: 'TP.HCM' },
      { name: 'Bệnh viện Bạch Mai', orgId: 'HOSP_002', city: 'Hà Nội' },
      { name: 'Bệnh viện Đà Nẵng', orgId: 'HOSP_003', city: 'Đà Nẵng' }
    ];

    for (let i = 0; i < hospitalNames.length; i++) {
      const hosp = hospitalNames[i];
      const hospital = await User.create({
        username: `hospital${i + 1}`,
        email: `hospital${i + 1}@example.com`,
        password: defaultPassword,
        fullName: hosp.name,
        phone: `07${String(i + 1).padStart(8, '0')}`,
        address: `${300 + i * 50} Đường ${hosp.city}, Phường ${i + 3}, Quận ${i + 3}, ${hosp.city}`,
        role: 'hospital',
        organizationId: hosp.orgId,
        organizationInfo: {
          name: hosp.name,
          license: `LIC_${hosp.orgId}`,
          type: 'hospital',
          description: `Bệnh viện đa khoa tại ${hosp.city}`
        },
        isActive: true,
        mustChangePassword: true
      });
      users.push(hospital);
    }
    console.log(`  ✅ Đã tạo ${hospitalNames.length} hospitals`);

    // Patients (5 bệnh nhân)
    const patientNames = [
      'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'
    ];

    for (let i = 0; i < patientNames.length; i++) {
      const patient = await User.create({
        username: `patient${i + 1}`,
        email: `patient${i + 1}@example.com`,
        password: defaultPassword,
        fullName: patientNames[i],
        phone: `06${String(i + 1).padStart(8, '0')}`,
        address: `${400 + i * 50} Đường Nguyễn Huệ, Phường ${i + 4}, Quận ${i + 4}, TP.HCM`,
        role: 'patient',
        patientId: `PAT_${String(i + 1).padStart(3, '0')}`,
        isActive: true,
        mustChangePassword: true
      });
      users.push(patient);
    }
    console.log(`  ✅ Đã tạo ${patientNames.length} patients`);

    const manufacturers = users.filter(u => u.role === 'manufacturer');
    const distributors = users.filter(u => u.role === 'distributor');
    const hospitals = users.filter(u => u.role === 'hospital');
    const patients = users.filter(u => u.role === 'patient');

    console.log(`\n✅ Tổng cộng đã tạo ${users.length} users\n`);

    // ========== 2. TẠO DRUGS (LOẠI TRỪ THUỐC ĐÃ ĐƯỢC BỘ Y TẾ KIỂM ĐỊNH) ==========
    console.log('💊 2. Tạo drugs (loại trừ thuốc đã được Bộ Y tế kiểm định)...');
    
    const drugNames = [
      { name: 'Paracetamol 500mg', ingredient: 'Paracetamol', dosage: '500mg', form: 'viên nén' },
      { name: 'Ibuprofen 400mg', ingredient: 'Ibuprofen', dosage: '400mg', form: 'viên nén' },
      { name: 'Amoxicillin 250mg', ingredient: 'Amoxicillin', dosage: '250mg', form: 'viên nang' },
      { name: 'Ciprofloxacin 500mg', ingredient: 'Ciprofloxacin', dosage: '500mg', form: 'viên nén' },
      { name: 'Metformin 500mg', ingredient: 'Metformin', dosage: '500mg', form: 'viên nén' },
      { name: 'Aspirin 100mg', ingredient: 'Acetylsalicylic acid', dosage: '100mg', form: 'viên nén' },
      { name: 'Omeprazole 20mg', ingredient: 'Omeprazole', dosage: '20mg', form: 'viên nang' },
      { name: 'Atorvastatin 10mg', ingredient: 'Atorvastatin', dosage: '10mg', form: 'viên nén' },
      { name: 'Amlodipine 5mg', ingredient: 'Amlodipine', dosage: '5mg', form: 'viên nén' },
      { name: 'Lisinopril 10mg', ingredient: 'Lisinopril', dosage: '10mg', form: 'viên nén' }
    ];

    const drugs = [];
    const testByOptions = ['Phòng Kiểm định Chất lượng', 'Trung tâm Kiểm định Dược phẩm', 'Cơ quan Kiểm định Độc lập'];
    
    for (let i = 0; i < drugNames.length; i++) {
      const drugData = drugNames[i];
      const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
      const batchNumber = `BATCH${String(i + 1).padStart(3, '0')}`;
      
      // Tạo ngày sản xuất và hạn sử dụng
      const productionDate = new Date();
      productionDate.setMonth(productionDate.getMonth() - Math.floor(Math.random() * 6));
      const expiryDate = new Date(productionDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 2);

      // Chỉ một số thuốc được Bộ Y tế kiểm định (để test filter)
      const isVerifiedByMOH = i < 2; // 2 thuốc đầu được Bộ Y tế kiểm định
      const testBy = isVerifiedByMOH 
        ? 'Cục Quản lý Dược - Bộ Y tế'
        : testByOptions[Math.floor(Math.random() * testByOptions.length)];

      const drug = await Drug.create({
        name: drugData.name,
        activeIngredient: drugData.ingredient,
        dosage: drugData.dosage,
        form: drugData.form,
        batchNumber: batchNumber,
        productionDate: productionDate,
        expiryDate: expiryDate,
        qualityTest: {
          testDate: new Date(productionDate.getTime() + 24 * 60 * 60 * 1000),
          testResult: isVerifiedByMOH ? 'đạt' : ['đạt', 'đang kiểm định'][Math.floor(Math.random() * 2)],
          testBy: testBy,
          testReport: `Báo cáo kiểm định cho ${drugData.name}`,
          certificateNumber: `CERT${String(i + 1).padStart(3, '0')}`
        },
        storage: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 45, max: 65, unit: '%' },
          lightSensitive: Math.random() > 0.7,
          specialInstructions: 'Bảo quản nơi khô ráo, tránh ánh sáng trực tiếp'
        },
        manufacturerId: manufacturer._id,
        createdBy: manufacturer._id,
        distribution: {
          status: ['sản_xuất', 'kiểm_định', 'tại_kho'][Math.floor(Math.random() * 3)],
          currentLocation: {
            type: 'nhà_máy',
            organizationId: manufacturer.organizationId,
            organizationName: manufacturer.organizationInfo.name,
            address: `${manufacturer.address.street}, ${manufacturer.address.city}`
          }
        },
        status: 'active'
      });

      drugs.push(drug);
    }

    console.log(`  ✅ Đã tạo ${drugs.length} drugs (${drugs.filter(d => d.qualityTest.testBy.includes('Bộ Y tế')).length} được Bộ Y tế kiểm định)\n`);

    // ========== 3. TẠO INVENTORY ==========
    console.log('📦 3. Tạo inventory...');
    
    const locations = [
      { id: 'WH001', name: 'Kho chính Hà Nội', type: 'warehouse' },
      { id: 'WH002', name: 'Kho phụ TP.HCM', type: 'warehouse' },
      { id: 'HOSP001', name: 'Bệnh viện Chợ Rẫy', type: 'hospital' },
      { id: 'HOSP002', name: 'Bệnh viện Bạch Mai', type: 'hospital' },
      { id: 'DIST001', name: 'Trung tâm phân phối miền Bắc', type: 'distribution_center' }
    ];

    const inventoryItems = [];
    for (const drug of drugs) {
      const numLocations = Math.floor(Math.random() * 2) + 2;
      const selectedLocations = locations.sort(() => 0.5 - Math.random()).slice(0, numLocations);

      for (const location of selectedLocations) {
        const quantity = Math.floor(Math.random() * 500) + 50;
        const unitPrice = Math.floor(Math.random() * 50000) + 5000;
        const supplier = manufacturers[Math.floor(Math.random() * manufacturers.length)];

        const inventoryItem = await Inventory.create({
          drug: drug._id,
          drugId: drug.drugId,
          drugName: drug.name,
          batchNumber: drug.batchNumber,
          location: {
            type: location.type,
            locationId: location.id,
            locationName: location.name,
            address: `${location.name}, Việt Nam`
          },
          quantity,
          unit: 'viên',
          minStock: Math.floor(quantity * 0.1),
          maxStock: quantity * 2,
          status: 'available',
          expiryDate: drug.expiryDate,
          productionDate: drug.productionDate,
          unitPrice,
          supplier: supplier._id,
          supplierName: supplier.fullName,
          createdBy: supplier._id,
          updatedBy: supplier._id
        });

        inventoryItems.push(inventoryItem);

        // Tạo transaction
        await InventoryTransaction.create({
          inventory: inventoryItem._id,
          drug: drug._id,
          drugId: drug.drugId,
          batchNumber: drug.batchNumber,
          type: 'in',
          quantity,
          quantityBefore: 0,
          quantityAfter: quantity,
          unit: 'viên',
          unitPrice: unitPrice,
          reason: 'purchase',
          location: {
            locationId: location.id,
            locationName: location.name
          },
          performedBy: supplier._id,
          performedByName: supplier.fullName,
          status: 'completed'
        });
      }
    }

    console.log(`  ✅ Đã tạo ${inventoryItems.length} inventory items\n`);

    // ========== 4. TẠO ORDERS ==========
    console.log('🛒 4. Tạo orders...');
    
    const orders = [];
    for (let i = 0; i < 15; i++) {
      const orderType = ['purchase', 'sales', 'transfer'][Math.floor(Math.random() * 3)];
      let buyer, seller;

      if (orderType === 'purchase') {
        buyer = [hospitals[0], distributors[0]][Math.floor(Math.random() * 2)];
        seller = manufacturers[Math.floor(Math.random() * manufacturers.length)];
      } else if (orderType === 'sales') {
        seller = [manufacturers[0], distributors[0]][Math.floor(Math.random() * 2)];
        buyer = hospitals[Math.floor(Math.random() * hospitals.length)] || distributors[0];
      } else {
        buyer = distributors[Math.floor(Math.random() * distributors.length)];
        seller = distributors[Math.floor(Math.random() * distributors.length)];
      }

      const numItems = Math.floor(Math.random() * 4) + 1;
      const orderItemsData = [];
      let subtotal = 0;

      // Chuẩn bị dữ liệu item (chưa lưu DB)
      for (let j = 0; j < numItems; j++) {
        const drug = drugs[Math.floor(Math.random() * drugs.length)];
        const quantity = Math.floor(Math.random() * 100) + 10;
        const unitPrice = Math.floor(Math.random() * 50000) + 5000;
        const totalPrice = quantity * unitPrice;
        subtotal += totalPrice;

        orderItemsData.push({
          drug,
          quantity,
          unitPrice,
          totalPrice
        });
      }

      const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      // Tạo số đơn hàng trước để gán cho OrderItem
      const orderNumber = `ORD${String(i + 1).padStart(6, '0')}`;

      // Tính các giá trị tiền cho đơn hàng
      const tax = subtotal * 0.1;
      const shippingFee = Math.floor(Math.random() * 100000) + 50000;
      const totalAmount = subtotal + tax + shippingFee;

      // Tạo order trước, chưa có items
      const order = await Order.create({
        orderNumber,
        orderType,
        buyer: buyer._id,
        buyerName: buyer.fullName,
        buyerOrganization: buyer.organizationInfo?.name || buyer.organizationId || '',
        seller: seller._id,
        sellerName: seller.fullName,
        sellerOrganization: seller.organizationInfo?.name || seller.organizationId || '',
        items: [],
        subtotal,
        tax,
        shippingFee,
        totalAmount,
        status,
        paymentMethod: ['bank_transfer', 'cash', 'credit_card'][Math.floor(Math.random() * 3)],
        createdBy: buyer._id,
        totalItems: numItems,
        totalQuantity: orderItemsData.reduce((sum, item) => sum + item.quantity, 0)
      });

      // Tạo OrderItem sau khi đã có order & orderNumber
      const createdItemIds = [];
      for (const item of orderItemsData) {
        const orderItem = await OrderItem.create({
          order: order._id,
          orderNumber: order.orderNumber,
          drug: item.drug._id,
          drugId: item.drug.drugId,
          drugName: item.drug.name,
          batchNumber: item.drug.batchNumber,
          quantity: item.quantity,
          unit: 'viên',
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        });

        createdItemIds.push(orderItem._id);
      }

      // Cập nhật lại items cho order
      order.items = createdItemIds;
      await order.save();

      orders.push(order);
    }

    console.log(`  ✅ Đã tạo ${orders.length} orders\n`);

    // ========== 5. TẠO INVOICES & PAYMENTS ==========
    console.log('🧾 5. Tạo invoices & payments...');
    
    const invoices = [];
    for (let i = 0; i < 10; i++) {
      const order = orders[Math.floor(Math.random() * orders.length)];

      // Xác định loại hóa đơn dựa trên loại đơn hàng
      const invoiceType = order.orderType === 'purchase' ? 'purchase' : 'sales';

      // Tính tổng tiền hóa đơn
      const subtotal = order.subtotal || 0;
      const tax = order.tax || 0;
      const shippingFee = order.shippingFee || 0;
      const totalAmount = order.totalAmount || (subtotal + tax + shippingFee);

      const invoiceStatusOptions = ['draft', 'issued', 'sent', 'paid'];
      const status = invoiceStatusOptions[Math.floor(Math.random() * invoiceStatusOptions.length)];

      const invoice = await Invoice.create({
        invoiceNumber: `INV${String(i + 1).padStart(6, '0')}`,
        invoiceType,
        order: order._id,
        orderNumber: order.orderNumber,
        seller: order.seller,
        sellerInfo: {
          name: order.sellerName,
          organization: order.sellerOrganization || '',
          address: order.sellerOrganization || '',
          phone: '0123456789',
          email: 'seller@example.com'
        },
        buyer: order.buyer,
        buyerInfo: {
          name: order.buyerName,
          organization: order.buyerOrganization || '',
          address: order.buyerOrganization || '',
          phone: '0123456789',
          email: 'buyer@example.com'
        },
        items: [], // đơn giản: không clone chi tiết từng OrderItem ở đây
        subtotal,
        tax,
        shippingFee,
        discount: 0,
        totalAmount,
        paidAmount: status === 'paid' ? totalAmount : 0,
        status,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentMethod: order.paymentMethod || 'bank_transfer',
        paymentStatus: status === 'paid' ? 'paid' : 'pending',
        createdBy: order.seller
      });

      invoices.push(invoice);

      // Tạo payment nếu invoice đã được thanh toán
      if (invoice.status === 'paid') {
        const method = invoice.paymentMethod || 'bank_transfer';

        await Payment.create({
          transactionNumber: Payment.generateTransactionNumber(),
          paymentType: 'invoice_payment',
          invoice: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          order: order._id,
          payer: order.buyer,
          payerInfo: {
            name: order.buyerName,
            organization: order.buyerOrganization || '',
            accountNumber: '123456789'
          },
          payee: order.seller,
          payeeInfo: {
            name: order.sellerName,
            organization: order.sellerOrganization || '',
            accountNumber: '987654321'
          },
          amount: invoice.totalAmount,
          method,
          status: 'completed',
          paymentDate: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
          notes: 'Thanh toán hóa đơn (seed dữ liệu)',
          createdBy: order.buyer
        });
      }
    }

    console.log(`  ✅ Đã tạo ${invoices.length} invoices và một số payments\n`);

    // ========== 6. TẠO SUPPLIERS & CONTRACTS ==========
    console.log('🏢 6. Tạo suppliers & contracts...');
    
    const suppliers = [];
    for (let i = 0; i < 5; i++) {
      const supplierCode = Supplier.generateSupplierCode();
      const supplier = await Supplier.create({
        supplierCode,
        name: `Nhà cung ứng ${i + 1}`,
        type: ['manufacturer', 'distributor', 'wholesaler'][Math.floor(Math.random() * 3)],
        contact: {
          email: `supplier${i + 1}@example.com`,
          phone: `0${Math.floor(Math.random() * 900000000) + 100000000}`
        },
        address: {
          street: `${100 + i * 50} Đường ABC`,
          city: ['Hà Nội', 'TP.HCM', 'Đà Nẵng'][Math.floor(Math.random() * 3)],
          country: 'Việt Nam'
        },
        legal: {
          taxCode: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          businessLicense: `BL${String(i + 1).padStart(6, '0')}`
        },
        status: 'active',
        createdBy: manufacturers[0]._id
      });

      suppliers.push(supplier);

      // Tạo contract
      await Contract.create({
        contractNumber: `CON${String(i + 1).padStart(6, '0')}`,
        contractType: ['supply', 'distribution', 'service'][Math.floor(Math.random() * 3)],
        supplier: supplier._id,
        supplierCode: supplier.supplierCode,
        buyer: manufacturers[0]._id,
        buyerInfo: {
          name: manufacturers[0].fullName,
          organization: manufacturers[0].organizationInfo?.name || '',
          taxCode: manufacturers[0].organizationInfo?.taxCode || ''
        },
        signedDate: new Date(),
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active',
        createdBy: manufacturers[0]._id
      });
    }

    console.log(`  ✅ Đã tạo ${suppliers.length} suppliers và contracts\n`);

    // ========== 7. TẠO SUPPLY CHAIN ==========
    console.log('🚚 7. Tạo supply chain...');
    
    for (let i = 0; i < 10; i++) {
      const drug = drugs[Math.floor(Math.random() * drugs.length)];
      const fromUser = manufacturers[Math.floor(Math.random() * manufacturers.length)];
      const toUser = [distributors[0], hospitals[0]][Math.floor(Math.random() * 2)];

      await SupplyChain.create({
        drugId: drug._id,
        drugBatchNumber: drug.batchNumber,
        // Các field không có trong schema sẽ bị bỏ qua, nên chỉ cần set những field hợp lệ
        status: ['active', 'completed', 'suspended'][Math.floor(Math.random() * 3)],
        createdBy: fromUser._id
      });
    }

    console.log(`  ✅ Đã tạo 10 supply chain records\n`);

    // ========== 8. TẠO TASKS ==========
    console.log('📋 8. Tạo tasks...');
    
    for (let i = 0; i < 10; i++) {
      const assignee = [manufacturers[0], distributors[0], hospitals[0]][Math.floor(Math.random() * 3)];
      await Task.create({
        title: `Nhiệm vụ ${i + 1}`,
        description: `Mô tả nhiệm vụ ${i + 1}`,
        type: 'other',
        status: ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
        dueDate: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        assignedTo: assignee._id,
        assignedBy: admin._id
      });
    }

    console.log(`  ✅ Đã tạo 10 tasks\n`);

    // ========== 9. TẠO NOTIFICATIONS ==========
    console.log('🔔 9. Tạo notifications...');
    
    for (let i = 0; i < 20; i++) {
      const recipient = users[Math.floor(Math.random() * users.length)];
      
      await Notification.create({
        title: `Thông báo hệ thống ${i + 1}`,
        content: `Nội dung thông báo hệ thống số ${i + 1}`,
        type: ['system', 'general', 'urgent'][Math.floor(Math.random() * 3)],
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
        status: 'published',
        sender: admin._id,
        recipients: [{
          user: recipient._id,
          isRead: Math.random() > 0.5
        }],
        scope: 'specific_users',
        scopeDetails: {
          userIds: [recipient._id]
        },
        relatedModule: 'system',
        isPublic: true,
        requiresAction: false
      });
    }

    console.log(`  ✅ Đã tạo 20 notifications\n`);

    // ========== 10. TẠO REVIEWS ==========
    console.log('⭐ 10. Tạo reviews...');
    
    for (let i = 0; i < 15; i++) {
      const reviewer = [hospitals[0], patients[0]][Math.floor(Math.random() * 2)];

      // Chọn target: có thể là drug, manufacturer, distributor hoặc hospital
      const targetChoice = Math.floor(Math.random() * 4);
      let targetDoc;
      let targetType;

      if (targetChoice === 0) {
        targetDoc = drugs[Math.floor(Math.random() * drugs.length)];
        targetType = 'drug';
      } else if (targetChoice === 1) {
        targetDoc = manufacturers[Math.floor(Math.random() * manufacturers.length)];
        targetType = 'manufacturer';
      } else if (targetChoice === 2) {
        targetDoc = distributors[Math.floor(Math.random() * distributors.length)];
        targetType = 'distributor';
      } else {
        targetDoc = hospitals[Math.floor(Math.random() * hospitals.length)];
        targetType = 'hospital';
      }

      const overallRating = Math.floor(Math.random() * 3) + 3; // 3-5

      await Review.create({
        targetType,
        targetId: targetDoc._id,
        targetName: targetType === 'drug' ? targetDoc.name : (targetDoc.fullName || targetDoc.organizationInfo?.name || 'Đối tượng'),
        reviewer: reviewer._id,
        reviewerInfo: {
          role: reviewer.role === 'patient' ? 'patient'
               : reviewer.role === 'hospital' ? 'hospital'
               : 'anonymous',
          location: reviewer.address || null,
          experience: null
        },
        overallRating,
        criteriaRatings: {
          drugQuality: targetType === 'drug' ? overallRating : null,
          effectiveness: targetType === 'drug' ? overallRating : null,
          deliveryTime: targetType !== 'drug' ? overallRating : null,
          customerService: targetType !== 'drug' ? overallRating : null
        },
        title: `Đánh giá ${targetType === 'drug' ? 'thuốc' : 'đơn vị'} ${i + 1}`,
        content: `Đánh giá tự động cho ${targetType === 'drug' ? targetDoc.name : (targetDoc.fullName || targetDoc.organizationInfo?.name || '')}.`,
        reviewType: targetType === 'drug' ? 'usage' : 'service',
        status: 'approved',
        isAnonymous: false,
        isVerified: true
      });
    }

    console.log(`  ✅ Đã tạo 15 reviews\n`);

    // ========== 11. TẠO DIGITAL SIGNATURES ==========
    console.log('✍️  11. Tạo digital signatures...');
    
    for (let i = 0; i < 10; i++) {
      const signer = [manufacturers[0], distributors[0], hospitals[0]][Math.floor(Math.random() * 3)];
      const targetDrug = drugs[Math.floor(Math.random() * drugs.length)];

      const dataToSign = {
        drugId: targetDrug._id.toString(),
        batchNumber: targetDrug.batchNumber,
        timestamp: Date.now()
      };

      const dataJson = JSON.stringify(dataToSign);
      // Hash đơn giản mô phỏng (không cần crypto thật cho seed)
      const dataHash = Buffer.from(dataJson).toString('base64').slice(0, 64);
      const signature = `MOCK_SIGNATURE_${i + 1}_${signer._id.toString().slice(-4)}`;

      const validFrom = new Date();
      const validTo = new Date();
      validTo.setFullYear(validTo.getFullYear() + 1);

      await DigitalSignature.create({
        targetType: 'drug',
        targetId: targetDrug._id,
        signedBy: signer._id,
        signedByName: signer.fullName,
        signedByRole: signer.role,
        dataHash,
        signature,
        certificate: {
          serialNumber: `CERT-${Date.now()}-${i}`,
          caProvider: 'vnca',
          caName: 'CA Quốc gia Việt Nam',
          certificateInfo: {
            subject: `CN=${signer.fullName}, O=${signer.organizationInfo?.name || 'Organization'}, C=VN`,
            issuer: 'O=CA Quốc gia Việt Nam, C=VN',
            validFrom,
            validTo,
            publicKey: `MOCK_PUBLIC_KEY_${i}`,
            algorithm: 'RSA-SHA256'
          },
          certificateStatus: 'valid',
          lastVerified: new Date()
        },
        timestamp: {
          timestampToken: `TS_TOKEN_${i}`,
          tsaUrl: 'https://tsa.vnca.gov.vn',
          timestampedAt: new Date(),
          timestampHash: `TS_HASH_${i}`,
          timestampStatus: 'verified'
        },
        purpose: 'Seed dữ liệu chữ ký số demo',
        status: 'active',
        signingInfo: {
          usedHsm: false,
          method: 'mock',
          keyId: `MOCK_KEY_${i}`,
          algorithm: 'RSA-SHA256'
        }
      });
    }

    console.log(`  ✅ Đã tạo 10 digital signatures\n`);

    // ========== 12. TẠO TRUST SCORES ==========
    console.log('🏆 12. Tạo trust scores...');
    
    const allSuppliers = [...manufacturers, ...distributors, ...hospitals];
    for (const supplier of allSuppliers) {
      const reviewScore = 100 + Math.random() * 200; // 100-300
      const complianceScore = 100 + Math.random() * 150; // 100-250
      const qualityScore = 80 + Math.random() * 120; // 80-200
      const efficiencyScore = 60 + Math.random() * 90; // 60-150
      const timelinessScore = 40 + Math.random() * 60; // 40-100
      
      const trustScore = Math.floor(reviewScore + complianceScore + qualityScore + efficiencyScore + timelinessScore);
      const trustLevel = trustScore >= 700 ? 'A' : trustScore >= 500 ? 'B' : trustScore >= 300 ? 'C' : 'D';
      
      await SupplierTrustScore.create({
        supplier: supplier._id,
        supplierName: supplier.fullName,
        supplierRole: supplier.role,
        organizationId: supplier.organizationId || '',
        trustScore: trustScore,
        trustLevel: trustLevel,
        scoreBreakdown: {
          reviewScore: Math.floor(reviewScore),
          complianceScore: Math.floor(complianceScore),
          qualityScore: Math.floor(qualityScore),
          efficiencyScore: Math.floor(efficiencyScore),
          timelinessScore: Math.floor(timelinessScore)
        },
        createdBy: admin._id
      });
    }

    console.log(`  ✅ Đã tạo trust scores cho ${allSuppliers.length} suppliers\n`);

    // ========== 13. TẠO AUDIT LOGS ==========
    console.log('📝 13. Tạo audit logs...');
    
    const auditActions = [
      { action: 'login', module: 'auth', description: 'User đăng nhập hệ thống', severity: 'low' },
      { action: 'drug_create', module: 'drug', description: 'Tạo lô thuốc mới', severity: 'medium' },
      { action: 'drug_update', module: 'drug', description: 'Cập nhật thông tin lô thuốc', severity: 'medium' },
      { action: 'supply_chain_create', module: 'supply_chain', description: 'Tạo chuỗi cung ứng mới', severity: 'medium' },
      { action: 'signature_create', module: 'digital_signature', description: 'Tạo chữ ký số', severity: 'high' },
      { action: 'review_create', module: 'review', description: 'Tạo đánh giá mới', severity: 'low' }
    ];

    const auditEntityTypes = ['User', 'Drug', 'SupplyChain', 'DigitalSignature', 'Review', 'Task'];
    const auditResults = ['success', 'success', 'success', 'failure', 'partial'];

    for (let i = 0; i < 30; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const randomAction = auditActions[Math.floor(Math.random() * auditActions.length)];
      const entityType = auditEntityTypes[Math.floor(Math.random() * auditEntityTypes.length)];
      const result = auditResults[Math.floor(Math.random() * auditResults.length)];

      await AuditLog.create({
        user: user._id,
        username: user.username || user.email,
        userRole: user.role,
        action: randomAction.action,
        module: randomAction.module,
        entityType,
        entityId: new mongoose.Types.ObjectId(),
        description: `${randomAction.description} (log ${i + 1})`,
        result,
        severity: randomAction.severity,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        requestMethod: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
        requestPath: `/api/${randomAction.module}`,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        correlationId: `seed-${Date.now()}-${i}`
      });
    }

    console.log(`  ✅ Đã tạo 30 audit logs\n`);

    // ========== 14. TẠO BACKUPS ==========
    console.log('💾 14. Tạo backups...');
    
    for (let i = 0; i < 5; i++) {
      const type = ['full', 'incremental'][Math.floor(Math.random() * 2)];
      const status = ['completed', 'failed'][Math.floor(Math.random() * 2)];

      await Backup.create({
        name: `Seed backup #${i + 1}`,
        type,
        scope: 'all',
        filePath: `/backups/backup_${i + 1}.tar.gz`,
        fileSize: Math.floor(Math.random() * 1000000000) + 100000000,
        format: 'tar',
        status,
        database: {
          name: 'drug-traceability'
        },
        metadata: {
          mongooseVersion: mongoose.version,
          nodeVersion: process.version,
          timestamp: new Date(),
          checksum: `CHECKSUM_${i + 1}`
        },
        createdBy: admin._id
      });
    }

    console.log(`  ✅ Đã tạo 5 backups\n`);

    // ========== TỔNG KẾT ==========
    console.log('\n📊 TỔNG KẾT DỮ LIỆU ĐÃ TẠO:\n');
    
    const counts = {
      users: await User.countDocuments(),
      drugs: await Drug.countDocuments(),
      inventory: await Inventory.countDocuments(),
      orders: await Order.countDocuments(),
      invoices: await Invoice.countDocuments(),
      payments: await Payment.countDocuments(),
      suppliers: await Supplier.countDocuments(),
      contracts: await Contract.countDocuments(),
      supplyChain: await SupplyChain.countDocuments(),
      tasks: await Task.countDocuments(),
      notifications: await Notification.countDocuments(),
      reviews: await Review.countDocuments(),
      digitalSignatures: await DigitalSignature.countDocuments(),
      trustScores: await SupplierTrustScore.countDocuments(),
      auditLogs: await AuditLog.countDocuments(),
      backups: await Backup.countDocuments()
    };

    console.log(`  ✅ Users: ${counts.users}`);
    console.log(`  ✅ Drugs: ${counts.drugs} (${drugs.filter(d => d.qualityTest.testBy.includes('Bộ Y tế')).length} được Bộ Y tế kiểm định)`);
    console.log(`  ✅ Inventory: ${counts.inventory}`);
    console.log(`  ✅ Orders: ${counts.orders}`);
    console.log(`  ✅ Invoices: ${counts.invoices}`);
    console.log(`  ✅ Payments: ${counts.payments}`);
    console.log(`  ✅ Suppliers: ${counts.suppliers}`);
    console.log(`  ✅ Contracts: ${counts.contracts}`);
    console.log(`  ✅ Supply Chain: ${counts.supplyChain}`);
    console.log(`  ✅ Tasks: ${counts.tasks}`);
    console.log(`  ✅ Notifications: ${counts.notifications}`);
    console.log(`  ✅ Reviews: ${counts.reviews}`);
    console.log(`  ✅ Digital Signatures: ${counts.digitalSignatures}`);
    console.log(`  ✅ Trust Scores: ${counts.trustScores}`);
    console.log(`  ✅ Audit Logs: ${counts.auditLogs}`);
    console.log(`  ✅ Backups: ${counts.backups}`);

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`\n📈 Tổng cộng: ${total} records\n`);

    console.log('✅ Hoàn thành tạo dữ liệu thật cho tất cả tài khoản phân quyền!');
    console.log('\n📋 THÔNG TIN ĐĂNG NHẬP:');
    console.log('  Admin: admin / default123');
    console.log('  Manufacturers: manufacturer1, manufacturer2, manufacturer3 / default123');
    console.log('  Distributors: distributor1, distributor2, distributor3 / default123');
    console.log('  Hospitals: hospital1, hospital2, hospital3 / default123');
    console.log('  Patients: patient1, patient2, patient3, patient4, patient5 / default123');
    console.log('\n⚠️  Lưu ý: Lần đầu đăng nhập sẽ yêu cầu đổi mật khẩu!');
    console.log('\n💡 Lưu ý: Các role không phải admin sẽ không thấy thuốc đã được Bộ Y tế kiểm định.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu:', error);
    process.exit(1);
  }
}

// Chạy script
if (require.main === module) {
  seedRealDataAllRoles();
}

module.exports = seedRealDataAllRoles;

