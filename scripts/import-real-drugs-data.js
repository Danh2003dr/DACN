const mongoose = require('mongoose');
require('dotenv').config();
const Drug = require('../models/Drug');
const User = require('../models/User');

// Kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Dữ liệu thuốc thật từ hình ảnh
const realDrugsData = [
  {
    name: 'Algostase Mono 500 mg',
    activeIngredient: 'Paracetamol',
    dosage: '500mg',
    form: 'viên nén sủi',
    batchNumber: 'BATCH_540100430425',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '540100430425',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 1 Tuýp x 16 Viên',
    standard: 'NSX',
    shelfLife: 24, // tháng
    registeredCompany: {
      name: 'Công ty TNHH Xúc tiến Thương mại Dược phẩm và Đầu tư TV',
      country: 'Việt Nam',
      address: 'Số 72 Bình Giã, Phường 13, Quận Tân Bình, Thành phố Hồ Chí Minh'
    },
    manufacturerCompany: {
      name: 'SMB Technology S.A.',
      country: 'Belgium',
      address: 'Rue du Parc Industriel 39, 6900 Marche-en-Famenne'
    }
  },
  {
    name: 'SK-Cetri',
    activeIngredient: 'Cetirizine dihydrochloride',
    dosage: '1mg',
    form: 'dung dịch uống',
    batchNumber: 'BATCH_890100428825',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '890100428825',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 1 chai x 60ml, chai PET kèm cốc đong',
    standard: 'BP hiện hành',
    shelfLife: 24,
    registeredCompany: {
      name: 'Công ty TNHH Một thành viên Dược phẩm PV Healthcare',
      country: 'Việt Nam',
      address: '4/5 Khu Dân Cư Vạn Xuân Đất Việt, Đường Số 5, Phường Bình Hưng Hòa, Quận Bình Tân, TP. Hồ Chí Minh'
    },
    manufacturerCompany: {
      name: 'S Kant Healthcare Ltd.',
      country: 'India',
      address: 'Plot No. 1802 - 1805, G.I.D.C., Phase III, Vapi City - Vapi - 396 195, District - Valsad, Gujarat state'
    }
  },
  {
    name: 'Deslodin 2.5 mg/5ml',
    activeIngredient: 'Desloratadine',
    dosage: '0,05% (w/v)',
    form: 'siro',
    batchNumber: 'BATCH_868100427925',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '868100427925',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 1 Chai 150ml kèm muỗng có vạch chía liều',
    standard: 'NSX',
    shelfLife: 24,
    registeredCompany: {
      name: 'Công ty TNHH Medfatop',
      country: 'Việt Nam',
      address: '34C Đường số 22, Khu phố 23, Phường Bình Hưng Hòa A, Quận Bình Tân, TP. Hồ Chí Minh'
    },
    manufacturerCompany: {
      name: 'Vem İlaç San. ve Tic. A.Ş.',
      country: 'Türkiye',
      address: 'Çerkezköy Organize Sanayi Bölgesi Karaağaç Mahallesi Fatih Bulvarı No:38 Kapaklı/Tekirdağ'
    }
  },
  {
    name: 'Aciclovir Cream B.P. 5% w/w',
    activeIngredient: 'Aciclovir',
    dosage: '5% (w/w)',
    form: 'kem bôi da',
    batchNumber: 'BATCH_890100426825',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '890100426825',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 01 tuýp x 15 gam',
    standard: 'BP 2021',
    shelfLife: 24,
    registeredCompany: {
      name: 'Công ty TNHH Dược phẩm Y-Med',
      country: 'Việt Nam',
      address: 'Số 1-3, Đường số 45, Phường 6, Quận 4, TP. Hồ Chí Minh'
    },
    manufacturerCompany: {
      name: 'Yash Medicare Pvt. Ltd.',
      country: 'India',
      address: 'Near Sabar Dairy, Talod Road, P.O. Hajipur, Tal-Himatnagar, City: Hajipur - 383 006, Dist: Sabarkantha, Gujarat State'
    }
  },
  {
    name: 'Silverkant',
    activeIngredient: 'Bạc sulfadiazin',
    dosage: '1% (w/w)',
    form: 'kem bôi da',
    batchNumber: 'BATCH_890100426625',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '890100426625',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 1 Tuýp x 15 gam',
    standard: 'USP 2024',
    shelfLife: 36,
    registeredCompany: {
      name: 'Công ty TNHH Dược phẩm Y-Med',
      country: 'Việt Nam',
      address: 'Số 1-3, Đường số 45, Phường 6, Quận 4, TP. Hồ Chí Minh'
    },
    manufacturerCompany: {
      name: 'S Kant Healthcare Ltd.',
      country: 'India',
      address: 'Plot No. 1802-1805, G.I.D.C., Phase III, Vapi 396 195, Gujarat State'
    }
  },
  {
    name: 'Desloratadine Normon 5 mg Film-Coated Tablets',
    activeIngredient: 'Desloratadin',
    dosage: '5mg',
    form: 'viên nén bao phim',
    batchNumber: 'BATCH_840100425625',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '840100425625',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 2 vỉ x 10 viên',
    standard: 'NSX',
    shelfLife: 24,
    registeredCompany: {
      name: 'Công ty TNHH Dược phẩm Vạn Cường Phát',
      country: 'Việt Nam',
      address: '299/28C đường Lý Thường Kiệt, phường 15, quận 11, thành phố Hồ Chí Minh'
    },
    manufacturerCompany: {
      name: 'Laboratorios Normon, S.A.',
      country: 'Spain',
      address: 'Ronda de Valdecarrizo, 6, 28760 Tres Cantos (Madrid)'
    }
  },
  {
    name: 'Paraliq',
    activeIngredient: 'Paracetamol',
    dosage: '500mg',
    form: 'viên nang mềm',
    batchNumber: 'BATCH_890100424325',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '890100424325',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 2 vỉ x 10 viên; Hộp 3 vỉ x 10 viên; Hộp 5 vỉ x 10 viên; Hộp 10 vỉ x 10 viên',
    standard: 'NSX',
    shelfLife: 36,
    registeredCompany: {
      name: 'Công ty TNHH Dược phẩm New Far East',
      country: 'Việt Nam',
      address: 'Số 011 Cao Ốc H1, đường Hoàng Diệu, phường 09, Quận 04, Thành phố Hồ Chí Minh'
    },
    manufacturerCompany: {
      name: 'Olive Healthcare',
      country: 'India',
      address: 'Unit-II, Plot 163/2, Mahatma Gandhi Udyog Nagar, Dabhel Village, Nani Daman - 396 210'
    }
  },
  {
    name: 'Asclotriz Cream',
    activeIngredient: 'Clotrimazole',
    dosage: '10mg/g',
    form: 'kem bôi ngoài da',
    batchNumber: 'BATCH_560100424025',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '560100424025',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 1 tuýp x 20g',
    standard: 'NSX',
    shelfLife: 60,
    registeredCompany: {
      name: 'Công ty TNHH Dược Phẩm Liên Hợp',
      country: 'Việt Nam',
      address: '480C Nguyễn Thị Thập, Phường Tân Quy, Quận 7, thành phố Hồ Chí Minh'
    },
    manufacturerCompany: {
      name: 'Sofarimex – Indústria Química E Farmacêutica, S.A.',
      country: 'Portugal',
      address: 'Av. Das Indústrias - Alto do Colaride, 2735 - 213, Cacém'
    }
  },
  {
    name: 'Elisone Cream',
    activeIngredient: 'Mometasone Furoate',
    dosage: '1mg/g',
    form: 'thuốc kem',
    batchNumber: 'BATCH_471100423025',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '471100423025',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 1 Tuýp x 5mg; Hộp 1 Tuýp x 15mg',
    standard: 'USP 42',
    shelfLife: 36,
    registeredCompany: {
      name: 'Công ty TNHH Dược phẩm An Khang',
      country: 'Việt Nam',
      address: '232/8 Quốc Lộ 13, Phường 26, Quận Bình Thạnh, Thành phố Hồ Chí Minh'
    },
    manufacturerCompany: {
      name: 'CBC Biotechnological & Pharmaceutical Co., Ltd. Tan Shui Factory',
      country: 'Taiwan',
      address: 'No. 120, Xingzhong Rd., Tamsui Dist., New Taipei City 251'
    }
  },
  {
    name: 'Ibuprophen DS 20 mg/ml oral suspension',
    activeIngredient: 'Ibuprofen',
    dosage: '2% (w/v)',
    form: 'hỗn dịch uống',
    batchNumber: 'BATCH_380100422925',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '380100422925',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 1 chai x 100ml, chai nhựa PET sầm màu và 1 xylanh có vạch chia liều để lấy thuốc',
    standard: 'NSX',
    shelfLife: 36,
    registeredCompany: {
      name: 'Công ty TNHH Danhson Trading VN',
      country: 'Việt Nam',
      address: 'Phòng 303, Tầng 3, số 253 Dũng Sĩ Thanh Khê, Phường Thanh Khê Tây, Quận Thanh Khê, Thành phố Đà Nẵng'
    },
    manufacturerCompany: {
      name: 'Vetprom AD',
      country: 'Bulgaria',
      address: 'The Vpharma site, 26 Otets Paisiy Str., Radomir 2400'
    }
  },
  {
    name: 'Sinupan® Forte 200mg',
    activeIngredient: 'Cineole',
    dosage: '200mg',
    form: 'viên nang mềm kháng dịch vị',
    batchNumber: 'BATCH_400100422125',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '400100422125',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 1 vỉ x 21 viên; Hộp 2 vỉ x 25 viên',
    standard: 'NSX',
    shelfLife: 36,
    registeredCompany: {
      name: 'Công ty Cổ phần Tập đoàn Dược phẩm và Thương mại Sohaco',
      country: 'Việt Nam',
      address: 'Số 5 Láng Hạ, Phường Thành Công, Quận Ba Đình, Thành phố Hà Nội'
    },
    manufacturerCompany: {
      name: 'Catalent Germany Eberbach GmbH',
      country: 'Germany',
      address: 'Gammelsbacher Str.2, 69412 Eberbach'
    }
  },
  {
    name: 'Brudic',
    activeIngredient: 'Diclofenac diethylamin',
    dosage: '1,16 gam/100g (tương đương Diclofenac natri 1g)',
    form: 'gel',
    batchNumber: 'BATCH_890100419925',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '890100419925',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 1 Tuýp 30g',
    standard: 'BP hiện hành',
    shelfLife: 36,
    registeredCompany: {
      name: 'Brawn Laboratories Limited',
      country: 'India',
      address: 'C-64 Lajpat Nagar-1, Second Floor, South Delhi, New Delhi-110024'
    },
    manufacturerCompany: {
      name: 'Brawn Laboratories Limited',
      country: 'India',
      address: '13, NIT, Industrial Area, Faridabad-121001, Haryana'
    }
  },
  {
    name: 'Walertrax',
    activeIngredient: 'Ambroxol hydrochloride',
    dosage: '15mg/5ml (0,3% kl/tt)',
    form: 'siro',
    batchNumber: 'BATCH_890100418325',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '890100418325',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: 'Hộp 1 lọ x 100ml',
    standard: 'NSX',
    shelfLife: 36,
    registeredCompany: {
      name: 'Ar Tradex Private Limited',
      country: 'India',
      address: 'Unit No.11 Block H, Wegmans Prinston Plaza, Sector 18, Rohini, North West Delhi 110089'
    },
    manufacturerCompany: {
      name: 'Aurochem Laboratories (India) Pvt. Ltd.',
      country: 'India',
      address: 'Plot No.8, Palghar Taluka Ind. Co-op. Estate Ltd. Boisar Road, Tal. Palghar, Thane 401404 Maharashtra State'
    }
  },
  {
    name: 'Codein phosphat hemihydrat',
    activeIngredient: 'Nguyên liệu làm thuốc',
    dosage: 'Nguyên liệu làm thuốc',
    form: 'bột',
    batchNumber: 'BATCH_840501417225',
    productionDate: new Date('2024-10-20'),
    expiryDate: new Date('2030-10-20'),
    licenseNumber: '840501417225',
    decisionNumber: '562/QĐ-QLD',
    grantBatch: '126',
    grantYear: '2025',
    packaging: '≤50 gam: chai lọ thủy tinh, đóng kín và niêm phong, trong thùng carton; >50 gam – <250 gam: chai nhựa, túi nhựa, khóa niêm phong, thùng carton; >250 gam - 25kg: hai lớp túi nhựa polyethylen, thùng kim loại',
    standard: 'EP hiện hành (EP9)',
    shelfLife: 60,
    registeredCompany: {
      name: 'ACT Activités Chimiques et Thérapeutiques Laboratoires Sàrl',
      country: 'Switzerland',
      address: 'Avenue Eugène-Pittard 15, 1206 Genéve'
    },
    manufacturerCompany: {
      name: 'Alcaliber, S.A.U.',
      country: 'Spain',
      address: 'Avda. Ventalomar 1 - 45007 Toledo'
    }
  },
  {
    name: 'Medobroxol 3mg/ml',
    activeIngredient: 'Ambroxol hydrochloride',
    dosage: '3mg/ml',
    form: 'dung dịch uống',
    batchNumber: 'BATCH_893100406025',
    productionDate: new Date('2025-08-15'),
    expiryDate: new Date('2030-08-15'),
    licenseNumber: '893100406025',
    decisionNumber: '403/QĐ-QLD',
    grantBatch: '218',
    grantYear: '2025',
    packaging: 'Hộp liều',
    standard: 'NSX',
    shelfLife: 60,
    registeredCompany: {
      name: 'Công ty TNHH Dược phẩm và Thương mại',
      country: 'Việt Nam',
      address: 'Địa chỉ công ty đăng ký'
    },
    manufacturerCompany: {
      name: 'Công ty Dược phẩm sản xuất',
      country: 'Việt Nam',
      address: 'Địa chỉ công ty sản xuất'
    }
  },
  {
    name: 'Bromhexin 8 mg Kingphar',
    activeIngredient: 'Bromhexin hydroclorid',
    dosage: '8mg',
    form: 'viên nén',
    batchNumber: 'BATCH_893100405425',
    productionDate: new Date('2025-08-15'),
    expiryDate: new Date('2030-08-15'),
    licenseNumber: '893100405425',
    decisionNumber: '403/QĐ-QLD',
    grantBatch: '218',
    grantYear: '2025',
    packaging: 'Hộp',
    standard: 'NSX',
    shelfLife: 60,
    registeredCompany: {
      name: 'Công ty TNHH Dược phẩm Kingphar',
      country: 'Việt Nam',
      address: 'Địa chỉ công ty Kingphar'
    },
    manufacturerCompany: {
      name: 'Công ty Dược phẩm Kingphar',
      country: 'Việt Nam',
      address: 'Địa chỉ sản xuất Kingphar'
    }
  },
  {
    name: 'Lederta',
    activeIngredient: 'Sắt (III) proteinsuccinylat',
    dosage: 'Mỗi 7,5ml chứa Sắt (III) proteinsuccinylat (tương đương 20mg Fe3+) 400mg',
    form: 'dung dịch uống',
    batchNumber: 'BATCH_893100404925',
    productionDate: new Date('2025-08-15'),
    expiryDate: new Date('2030-08-15'),
    licenseNumber: '893100404925',
    decisionNumber: '403/QĐ-QLD',
    grantBatch: '218',
    grantYear: '2025',
    packaging: 'Hộp',
    standard: 'NSX',
    shelfLife: 60,
    registeredCompany: {
      name: 'Công ty TNHH Dược phẩm Lederta',
      country: 'Việt Nam',
      address: 'Địa chỉ công ty Lederta'
    },
    manufacturerCompany: {
      name: 'Công ty Dược phẩm Lederta',
      country: 'Việt Nam',
      address: 'Địa chỉ sản xuất Lederta'
    }
  },
  {
    name: 'Mildgel',
    activeIngredient: 'Magnesi hydroxid; Nhôm hydroxid',
    dosage: 'Magnesi hydroxid 400mg; Nhôm hydroxid (dưới dạng nhôm hydroxid dried gel 522,337mg) 400mg',
    form: 'hỗn dịch uống',
    batchNumber: 'BATCH_893100404525',
    productionDate: new Date('2025-08-15'),
    expiryDate: new Date('2030-08-15'),
    licenseNumber: '893100404525',
    decisionNumber: '403/QĐ-QLD',
    grantBatch: '218',
    grantYear: '2025',
    packaging: 'Hộp 50 g',
    standard: 'NSX',
    shelfLife: 60,
    registeredCompany: {
      name: 'Công ty TNHH Dược phẩm Mildgel',
      country: 'Việt Nam',
      address: 'Địa chỉ công ty Mildgel'
    },
    manufacturerCompany: {
      name: 'Công ty Dược phẩm Mildgel',
      country: 'Việt Nam',
      address: 'Địa chỉ sản xuất Mildgel'
    }
  },
  {
    name: 'Acalmin',
    activeIngredient: 'Calci carbonat; Vitamin D3',
    dosage: 'Calci carbonat 750mg; Vitamin D3 200 IU',
    form: 'viên nén',
    batchNumber: 'BATCH_893100404325',
    productionDate: new Date('2025-08-15'),
    expiryDate: new Date('2030-08-15'),
    licenseNumber: '893100404325',
    decisionNumber: '403/QĐ-QLD',
    grantBatch: '218',
    grantYear: '2025',
    packaging: 'Hộp',
    standard: 'NSX',
    shelfLife: 60,
    registeredCompany: {
      name: 'Công ty TNHH Dược phẩm Acalmin',
      country: 'Việt Nam',
      address: 'Địa chỉ công ty Acalmin'
    },
    manufacturerCompany: {
      name: 'Công ty Dược phẩm Acalmin',
      country: 'Việt Nam',
      address: 'Địa chỉ sản xuất Acalmin'
    }
  },
  {
    name: 'Lafexo 180',
    activeIngredient: 'Fexofenadine hydrochloride',
    dosage: '180mg',
    form: 'viên nén bao phim',
    batchNumber: 'BATCH_893100401125',
    productionDate: new Date('2025-08-15'),
    expiryDate: new Date('2030-08-15'),
    licenseNumber: '893100401125',
    decisionNumber: '403/QĐ-QLD',
    grantBatch: '218',
    grantYear: '2025',
    packaging: 'Hộp',
    standard: 'NSX',
    shelfLife: 60,
    registeredCompany: {
      name: 'Công ty TNHH MTV Dược phẩm LA TERRE FRANCE',
      country: 'Việt Nam',
      address: 'Lô B3-1, góc đường D4-N1, khu công nghiệp Hựu Thạnh, Xã Hựu Thạnh, Huyện Đức Hòa, Tỉnh Long An, Việt Nam'
    },
    manufacturerCompany: {
      name: 'Công ty TNHH MTV Dược phẩm LA TERRE FRANCE',
      country: 'Việt Nam',
      address: 'Lô B3-1, góc đường D4-N1, khu công nghiệp Hựu Thạnh, Xã Hựu Thạnh, Huyện Đức Hòa, Tỉnh Long An, Việt Nam'
    }
  },
  {
    name: 'Lafexo 120',
    activeIngredient: 'Fexofenadine hydrochloride',
    dosage: '120mg',
    form: 'viên nén bao phim',
    batchNumber: 'BATCH_893100401025',
    productionDate: new Date('2025-08-15'),
    expiryDate: new Date('2030-08-15'),
    licenseNumber: '893100401025',
    decisionNumber: '403/QĐ-QLD',
    grantBatch: '218',
    grantYear: '2025',
    packaging: 'Hộp',
    standard: 'NSX',
    shelfLife: 60,
    registeredCompany: {
      name: 'Công ty TNHH MTV Dược phẩm LA TERRE FRANCE',
      country: 'Việt Nam',
      address: 'Lô B3-1, góc đường D4-N1, khu công nghiệp Hựu Thạnh, Xã Hựu Thạnh, Huyện Đức Hòa, Tỉnh Long An, Việt Nam'
    },
    manufacturerCompany: {
      name: 'Công ty TNHH MTV Dược phẩm LA TERRE FRANCE',
      country: 'Việt Nam',
      address: 'Lô B3-1, góc đường D4-N1, khu công nghiệp Hựu Thạnh, Xã Hựu Thạnh, Huyện Đức Hòa, Tỉnh Long An, Việt Nam'
    }
  },
  {
    name: 'Lafancol 650',
    activeIngredient: 'Acetaminophen (Paracetamol)',
    dosage: '650mg',
    form: 'viên nén',
    batchNumber: 'BATCH_893100400925',
    productionDate: new Date('2025-08-15'),
    expiryDate: new Date('2030-08-15'),
    licenseNumber: '893100400925',
    decisionNumber: '403/QĐ-QLD',
    grantBatch: '218',
    grantYear: '2025',
    packaging: 'Hộp',
    standard: 'NSX',
    shelfLife: 60,
    registeredCompany: {
      name: 'Công ty TNHH MTV Dược phẩm LA TERRE FRANCE',
      country: 'Việt Nam',
      address: 'Lô B3-1, góc đường D4-N1, khu công nghiệp Hựu Thạnh, Xã Hựu Thạnh, Huyện Đức Hòa, Tỉnh Long An, Việt Nam'
    },
    manufacturerCompany: {
      name: 'Công ty TNHH MTV Dược phẩm LA TERRE FRANCE',
      country: 'Việt Nam',
      address: 'Lô B3-1, góc đường D4-N1, khu công nghiệp Hựu Thạnh, Xã Hựu Thạnh, Huyện Đức Hòa, Tỉnh Long An, Việt Nam'
    }
  },
  {
    name: 'Lafancol 500',
    activeIngredient: 'Acetaminophen (Paracetamol)',
    dosage: '500mg',
    form: 'viên nén',
    batchNumber: 'BATCH_893100400825',
    productionDate: new Date('2025-08-15'),
    expiryDate: new Date('2030-08-15'),
    licenseNumber: '893100400825',
    decisionNumber: '403/QĐ-QLD',
    grantBatch: '218',
    grantYear: '2025',
    packaging: 'Hộp',
    standard: 'NSX',
    shelfLife: 60,
    registeredCompany: {
      name: 'Công ty TNHH MTV Dược phẩm LA TERRE FRANCE',
      country: 'Việt Nam',
      address: 'Lô B3-1, góc đường D4-N1, khu công nghiệp Hựu Thạnh, Xã Hựu Thạnh, Huyện Đức Hòa, Tỉnh Long An, Việt Nam'
    },
    manufacturerCompany: {
      name: 'Công ty TNHH MTV Dược phẩm LA TERRE FRANCE',
      country: 'Việt Nam',
      address: 'Lô B3-1, góc đường D4-N1, khu công nghiệp Hựu Thạnh, Xã Hựu Thạnh, Huyện Đức Hòa, Tỉnh Long An, Việt Nam'
    }
  },
  {
    name: 'Diosplus',
    activeIngredient: 'Diosmin; Hesperidin',
    dosage: 'Diosmin 900mg; Hesperidin 100mg',
    form: 'viên nén bao phim',
    batchNumber: 'BATCH_893100399925',
    productionDate: new Date('2025-08-15'),
    expiryDate: new Date('2030-08-15'),
    licenseNumber: '893100399925',
    decisionNumber: '403/QĐ-QLD',
    grantBatch: '218',
    grantYear: '2025',
    packaging: 'Hộp',
    standard: 'NSX',
    shelfLife: 60,
    registeredCompany: {
      name: 'Công ty TNHH MTV Dược phẩm LA TERRE FRANCE',
      country: 'Việt Nam',
      address: 'Lô B3-1, góc đường D4-N1, khu công nghiệp Hựu Thạnh, Xã Hựu Thạnh, Huyện Đức Hòa, Tỉnh Long An, Việt Nam'
    },
    manufacturerCompany: {
      name: 'Công ty TNHH MTV Dược phẩm LA TERRE FRANCE',
      country: 'Việt Nam',
      address: 'Lô B3-1, góc đường D4-N1, khu công nghiệp Hựu Thạnh, Xã Hựu Thạnh, Huyện Đức Hòa, Tỉnh Long An, Việt Nam'
    }
  },
  {
    name: 'Diosce',
    activeIngredient: 'Diosmin; Hesperidin',
    dosage: 'Diosmin 450mg; Hesperidin 50mg',
    form: 'viên nén bao phim',
    batchNumber: 'BATCH_893100399825',
    productionDate: new Date('2025-08-15'),
    expiryDate: new Date('2030-08-15'),
    licenseNumber: '893100399825',
    decisionNumber: '403/QĐ-QLD',
    grantBatch: '218',
    grantYear: '2025',
    packaging: 'Hộp',
    standard: 'NSX',
    shelfLife: 60,
    registeredCompany: {
      name: 'Công ty TNHH MTV Dược phẩm LA TERRE FRANCE',
      country: 'Việt Nam',
      address: 'Lô B3-1, góc đường D4-N1, khu công nghiệp Hựu Thạnh, Xã Hựu Thạnh, Huyện Đức Hòa, Tỉnh Long An, Việt Nam'
    },
    manufacturerCompany: {
      name: 'Công ty TNHH MTV Dược phẩm LA TERRE FRANCE',
      country: 'Việt Nam',
      address: 'Lô B3-1, góc đường D4-N1, khu công nghiệp Hựu Thạnh, Xã Hựu Thạnh, Huyện Đức Hòa, Tỉnh Long An, Việt Nam'
    }
  }
];

// Hàm map form từ tiếng Việt sang enum trong model
const mapForm = (formVN) => {
  const formMap = {
    'viên nén sủi': 'viên nén',
    'dung dịch uống': 'viên nén', // fallback
    'siro': 'siro',
    'si rô': 'siro',
    'kem bôi da': 'kem',
    'kem bôi ngoài da': 'kem',
    'thuốc kem': 'kem',
    'viên nén bao phim': 'viên nén',
    'viên nang mềm': 'viên nang',
    'viên nang mềm kháng dịch vị': 'viên nang',
    'hỗn dịch uống': 'viên nén', // fallback - không có trong enum
    'gel': 'gel',
    'bột': 'cao khô' // fallback vì không có bột trong enum
  };
  return formMap[formVN.toLowerCase()] || 'khác';
};

// Import dữ liệu
const importRealDrugs = async () => {
  try {
    await connectDB();
    
    console.log('Bắt đầu import dữ liệu thuốc thật...');
    
    // Lấy hoặc tạo manufacturer user
    let manufacturer = await User.findOne({ role: 'manufacturer' });
    if (!manufacturer) {
      // Tạo manufacturer mặc định nếu chưa có
      try {
        manufacturer = await User.create({
          username: 'manufacturer_default',
          email: 'manufacturer@example.com',
          password: 'default123',
          fullName: 'Nhà sản xuất mặc định',
          phone: '0123456789',
          address: {
            street: '123 Đường ABC',
            ward: 'Phường 1',
            district: 'Quận 1',
            city: 'TP.HCM'
          },
          role: 'manufacturer',
          organizationId: 'MFG_DEFAULT',
          organizationInfo: {
            name: 'Nhà sản xuất mặc định',
            license: 'LIC_DEFAULT',
            type: 'pharmaceutical_company'
          },
          mustChangePassword: true
        });
        console.log('Đã tạo manufacturer mặc định');
      } catch (createError) {
        // Nếu không tạo được (có thể username/email đã tồn tại), lấy lại
        manufacturer = await User.findOne({ role: 'manufacturer' });
        if (!manufacturer) {
          console.error('Không thể tạo hoặc tìm manufacturer:', createError.message);
          throw new Error('Cần có ít nhất một manufacturer trong hệ thống');
        }
      }
    }
    
    // Đảm bảo manufacturer có đủ thông tin cần thiết
    if (manufacturer) {
      // Không save lại manufacturer nếu đã có, chỉ đảm bảo có giá trị mặc định
      const orgInfo = manufacturer.organizationInfo || {};
      const orgId = manufacturer.organizationId || 'MFG_DEFAULT';
      const orgName = orgInfo?.name || manufacturer.fullName || 'Nhà sản xuất mặc định';
      
      console.log(`Sử dụng manufacturer: ${manufacturer.fullName} (${orgId})`);
      
      // Lưu các giá trị để sử dụng sau
      manufacturer._orgId = orgId;
      manufacturer._orgName = orgName;
      manufacturer._orgInfo = orgInfo;
    }
    
    // Tạo hoặc cập nhật drugs
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const drugData of realDrugsData) {
      try {
        // Tạo drugId unique
        const baseId = drugData.batchNumber.substring(6).replace(/[^0-9A-Z]/g, '').substring(0, 8);
        let drugId = `DRUG_${baseId}`;
        let drugIdSuffix = 0;
        
        // Kiểm tra xem drugId đã tồn tại chưa
        while (await Drug.findOne({ drugId })) {
          drugIdSuffix++;
          drugId = `DRUG_${baseId.substring(0, 7)}${drugIdSuffix}`;
        }
        
        // Kiểm tra xem batchNumber đã tồn tại chưa
        const existingDrug = await Drug.findOne({ 
          batchNumber: drugData.batchNumber 
        });
        
        if (existingDrug) {
          console.log(`Đã tồn tại: ${drugData.name} - ${drugData.batchNumber}`);
          skipped++;
          continue;
        }
        
        // Tạo blockchainId tạm thời để tránh duplicate null
        const tempBlockchainId = `BC_TEMP_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Tạo drug mới
        const drug = await Drug.create({
          drugId: drugId,
          name: drugData.name,
          activeIngredient: drugData.activeIngredient,
          dosage: drugData.dosage,
          form: mapForm(drugData.form),
          batchNumber: drugData.batchNumber,
          productionDate: drugData.productionDate,
          expiryDate: drugData.expiryDate,
          manufacturerId: manufacturer._id,
          createdBy: manufacturer._id,
          blockchain: {
            blockchainId: tempBlockchainId,
            blockchainStatus: 'pending',
            isOnBlockchain: false
          },
          qualityTest: {
            testDate: drugData.productionDate,
            testResult: 'đạt',
            testBy: 'Bộ Y tế',
            testReport: `Thuốc đã được đăng ký với số GPLH: ${drugData.licenseNumber}`,
            certificateNumber: drugData.licenseNumber
          },
          storage: {
            temperature: { min: 15, max: 25, unit: 'celsius' },
            humidity: { min: 45, max: 65, unit: '%' },
            lightSensitive: false,
            specialInstructions: `Bảo quản theo tiêu chuẩn ${drugData.standard || 'NSX'}, hạn sử dụng ${drugData.shelfLife} tháng`
          },
          distribution: {
            status: 'sản_xuất',
            currentLocation: {
              type: 'nhà_máy',
              organizationId: manufacturer._orgId || manufacturer.organizationId || 'MFG_DEFAULT',
              organizationName: manufacturer._orgName || manufacturer.organizationInfo?.name || manufacturer.fullName || 'Nhà sản xuất mặc định',
              address: `${manufacturer.address?.street || '123 Đường ABC'}, ${manufacturer.address?.ward || 'Phường 1'}, ${manufacturer.address?.district || 'Quận 1'}, ${manufacturer.address?.city || 'TP.HCM'}`
            }
          },
          packaging: {
            specifications: drugData.packaging,
            standard: drugData.standard || 'NSX',
            shelfLife: `${drugData.shelfLife} tháng`
          }
        });
        
        console.log(`✓ Đã tạo: ${drug.name} - ${drug.batchNumber}`);
        created++;
      } catch (error) {
        console.error(`✗ Lỗi khi tạo ${drugData.name}:`, error.message);
      }
    }
    
    console.log('\n=== KẾT QUẢ IMPORT ===');
    console.log(`Đã tạo: ${created} thuốc`);
    console.log(`Đã cập nhật: ${updated} thuốc`);
    console.log(`Đã bỏ qua: ${skipped} thuốc (đã tồn tại)`);
    console.log(`Tổng cộng: ${realDrugsData.length} thuốc`);
    
    // Ghi lên blockchain nếu có
    try {
      const blockchainService = require('../services/blockchainService');
      if (!blockchainService.isInitialized) {
        await blockchainService.initialize();
      }
      
      console.log('\nĐang ghi lên blockchain...');
      const drugs = await Drug.find({ batchNumber: { $in: realDrugsData.map(d => d.batchNumber) } });
      
      for (const drug of drugs) {
        if (!drug.blockchain || !drug.blockchain.blockchainId || drug.blockchain.blockchainId.startsWith('BC_TEMP')) {
          try {
            const result = await blockchainService.recordDrugBatchOnBlockchain({
              drugId: drug.drugId,
              name: drug.name,
              activeIngredient: drug.activeIngredient,
              manufacturerId: drug.manufacturerId.toString(),
              batchNumber: drug.batchNumber,
              productionDate: drug.productionDate,
              expiryDate: drug.expiryDate,
              qualityTest: drug.qualityTest,
              qrCode: drug.qrCode
            });
            
            if (result.success) {
              if (!drug.blockchain) {
                drug.blockchain = {};
              }
              drug.blockchain.blockchainId = result.blockchainId;
              drug.blockchain.transactionHash = result.transactionHash;
              drug.blockchain.blockNumber = result.blockNumber;
              drug.blockchain.blockHash = result.hash;
              drug.blockchain.digitalSignature = result.signature;
              drug.blockchain.isOnBlockchain = true;
              drug.blockchain.lastUpdated = new Date(result.timestamp);
              drug.blockchain.blockchainStatus = 'confirmed';
              drug.blockchain.dataHash = result.hash;
              await drug.save();
              console.log(`✓ Đã ghi lên blockchain: ${drug.name}`);
            }
          } catch (e) {
            console.log(`⚠ Không thể ghi lên blockchain ${drug.name}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.log('⚠ Blockchain service không khả dụng:', e.message);
    }
    
    console.log('\n✓ Hoàn thành!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi import:', error);
    process.exit(1);
  }
};

// Chạy script
importRealDrugs();

