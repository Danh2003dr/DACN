module.exports = {
  enabled: process.env.HSM_ENABLED === 'true',
  defaultProvider: process.env.HSM_PROVIDER || 'mock',
  providers: {
    mock: {
      id: 'mock',
      type: 'mock',
      name: 'Mock HSM Provider',
      description: 'Mô phỏng HSM cho môi trường development',
      defaultKeyId: 'MOCK_KEY_ID'
    },
    local: {
      id: 'local',
      type: 'local',
      name: 'Local Private Key Provider',
      description: 'Sử dụng private key lưu trong server (chỉ dùng cho demo)',
      privateKey: process.env.HSM_LOCAL_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
      algorithm: process.env.HSM_LOCAL_ALGORITHM || 'RSA-SHA256'
    },
    aws: {
      id: 'aws',
      type: 'aws-kms',
      name: 'AWS KMS',
      description: 'Amazon Web Services Key Management Service',
      region: process.env.HSM_AWS_REGION,
      accessKeyId: process.env.HSM_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.HSM_AWS_SECRET_ACCESS_KEY,
      keyId: process.env.HSM_AWS_KEY_ID
    }
  }
};

