module.exports = {
  vnca: {
    id: 'vnca',
    name: 'CA Quốc gia Việt Nam',
    url: 'https://ca.vnca.gov.vn',
    algorithm: 'RSA-SHA256',
    keySize: 2048,
    supportsHsm: true,
    description: 'Chứng thư số quốc gia cho các tổ chức tại Việt Nam'
  },
  'viettel-ca': {
    id: 'viettel-ca',
    name: 'Viettel CA',
    url: 'https://ca.viettel.vn',
    algorithm: 'RSA-SHA256',
    keySize: 2048,
    supportsHsm: true,
    description: 'Nhà cung cấp chữ ký số Viettel'
  },
  'fpt-ca': {
    id: 'fpt-ca',
    name: 'FPT CA',
    url: 'https://ca.fpt.vn',
    algorithm: 'RSA-SHA256',
    keySize: 2048,
    supportsHsm: true,
    description: 'Nhà cung cấp chữ ký số FPT'
  },
  'bkav-ca': {
    id: 'bkav-ca',
    name: 'Bkav CA',
    url: 'https://ca.bkav.com.vn',
    algorithm: 'RSA-SHA256',
    keySize: 2048,
    supportsHsm: true,
    description: 'Nhà cung cấp chữ ký số Bkav'
  },
  'vietnam-post-ca': {
    id: 'vietnam-post-ca',
    name: 'Vietnam Post CA',
    url: 'https://ca.vnpost.vn',
    algorithm: 'RSA-SHA256',
    keySize: 2048,
    supportsHsm: true,
    description: 'Nhà cung cấp chữ ký số của Bưu điện Việt Nam'
  }
};

