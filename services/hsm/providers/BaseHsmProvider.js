class BaseHsmProvider {
  constructor(config = {}) {
    this.config = config;
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
    return true;
  }

  async sign() {
    throw new Error('sign() chưa được triển khai cho provider này');
  }

  async destroy() {
    this.initialized = false;
  }

  async testConnection() {
    return {
      success: true,
      message: 'Provider sẵn sàng',
      provider: this.getMetadata()
    };
  }

  getMetadata() {
    return {
      id: this.config.id,
      name: this.config.name,
      type: this.config.type || 'custom'
    };
  }
}

module.exports = BaseHsmProvider;

