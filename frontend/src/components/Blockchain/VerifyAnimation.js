import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Globe,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Hash
} from 'lucide-react';

/**
 * VerifyAnimation Component
 * 
 * Visualizes the blockchain verification process with smooth animations.
 * 
 * @param {string} status - Current status: 'idle' | 'sending' | 'connecting' | 'verifying' | 'success' | 'error'
 * @param {string} transactionHash - Optional transaction hash to display
 * @param {string} message - Optional custom message
 * @param {number} size - Size of the animation (default: 'large' | 'medium' | 'small')
 */
const VerifyAnimation = ({ 
  status = 'idle', 
  transactionHash = null,
  message = null,
  size = 'large'
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-32 h-32',
      icon: 'w-8 h-8',
      text: 'text-sm'
    },
    medium: {
      container: 'w-48 h-48',
      icon: 'w-12 h-12',
      text: 'text-base'
    },
    large: {
      container: 'w-64 h-64',
      icon: 'w-16 h-16',
      text: 'text-lg'
    }
  };

  const config = sizeConfig[size];

  // Status messages
  const statusMessages = {
    idle: 'Sẵn sàng xác minh',
    sending: 'Đang gửi yêu cầu...',
    connecting: 'Đang kết nối node...',
    verifying: 'Đang xác minh trên blockchain...',
    success: 'Xác minh thành công!',
    error: 'Xác minh thất bại'
  };

  // Animation variants
  const containerVariants = {
    idle: {
      scale: 1,
      opacity: 0.5
    },
    active: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  // Sending: Paper plane pulsing and moving right
  const sendingVariants = {
    initial: { x: -20, opacity: 0 },
    animate: {
      x: [0, 20, 0],
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  // Connecting: Spinner rotating around Globe
  const connectingVariants = {
    rotate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }
    },
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  // Verifying: Magnifying glass scanning
  const verifyingVariants = {
    scan: {
      x: [-30, 30, -30],
      y: [-20, 20, -20],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
    document: {
      opacity: [0.3, 0.7, 0.3],
      scale: [0.95, 1, 0.95],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  // Success: Checkmark scaling up with bounce
  const successVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [0, 1.2, 1],
      opacity: [0, 1, 1],
      transition: {
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1] // Bounce effect
      }
    }
  };

  // Error: X shaking
  const errorVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [0, 1.1, 1],
      opacity: [0, 1, 1],
      x: [0, -10, 10, -10, 10, 0],
      transition: {
        scale: {
          duration: 0.4,
          ease: 'easeOut'
        },
        opacity: {
          duration: 0.4
        },
        x: {
          duration: 0.5,
          delay: 0.4,
          ease: 'easeInOut'
        }
      }
    }
  };

  // Render based on status
  const renderStatus = () => {
    switch (status) {
      case 'sending':
        return (
          <motion.div
            className="relative flex items-center justify-center"
            variants={containerVariants}
            initial="initial"
            animate="active"
          >
            <motion.div
              variants={sendingVariants}
              initial="initial"
              animate="animate"
              className="absolute"
            >
              <Send className={`${config.icon} text-blue-500`} />
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-blue-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              </div>
            </div>
          </motion.div>
        );

      case 'connecting':
        return (
          <motion.div
            className="relative flex items-center justify-center"
            variants={containerVariants}
            initial="initial"
            animate="active"
          >
            {/* Globe icon with pulse */}
            <motion.div
              variants={connectingVariants.pulse}
              initial="pulse"
              animate="pulse"
              className="absolute"
            >
              <Globe className={`${config.icon} text-indigo-500`} />
            </motion.div>
            {/* Rotating spinner around globe */}
            <motion.div
              variants={connectingVariants.rotate}
              initial="rotate"
              animate="rotate"
              className="absolute"
              style={{ width: config.icon.replace('w-', '').replace(' h-', '') + 'px' }}
            >
              <Loader2 className={`${config.icon} text-indigo-300`} />
            </motion.div>
            {/* Connection dots */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-indigo-500 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut'
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'verifying':
        return (
          <motion.div
            className="relative flex items-center justify-center"
            variants={containerVariants}
            initial="initial"
            animate="active"
          >
            {/* Document/Hash background */}
            <motion.div
              variants={verifyingVariants.document}
              initial="document"
              animate="document"
              className="absolute"
            >
              {transactionHash ? (
                <Hash className={`${config.icon} text-gray-400`} />
              ) : (
                <FileText className={`${config.icon} text-gray-400`} />
              )}
            </motion.div>
            {/* Scanning magnifying glass */}
            <motion.div
              variants={verifyingVariants.scan}
              initial="scan"
              animate="scan"
              className="absolute"
            >
              <Search className={`${config.icon} text-green-500`} />
            </motion.div>
            {/* Scanning beam effect */}
            <motion.div
              className="absolute w-full h-1 bg-green-200 rounded-full overflow-hidden"
              animate={{
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            className="relative flex items-center justify-center"
            variants={containerVariants}
            initial="initial"
            animate="active"
          >
            <motion.div
              variants={successVariants}
              initial="initial"
              animate="animate"
              className="relative"
            >
              <CheckCircle2 className={`${config.icon} text-green-500`} />
              {/* Ripple effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-green-200"
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{
                  scale: [1, 2, 2.5],
                  opacity: [0.8, 0.4, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeOut'
                }}
              />
            </motion.div>
            {/* Success particles */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-green-400 rounded-full"
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 0
                  }}
                  animate={{
                    x: Math.cos((i * Math.PI * 2) / 8) * 40,
                    y: Math.sin((i * Math.PI * 2) / 8) * 40,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.3,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                />
              ))}
            </div>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            className="relative flex items-center justify-center"
            variants={containerVariants}
            initial="initial"
            animate="active"
          >
            <motion.div
              variants={errorVariants}
              initial="initial"
              animate="animate"
              className="relative"
            >
              <XCircle className={`${config.icon} text-red-500`} />
              {/* Error pulse */}
              <motion.div
                className="absolute inset-0 rounded-full bg-red-200"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.2, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </motion.div>
          </motion.div>
        );

      default: // idle
        return (
          <motion.div
            className="relative flex items-center justify-center"
            variants={containerVariants}
            initial="idle"
            animate="idle"
          >
            <div className={`${config.icon} text-gray-400 opacity-50`}>
              <Hash />
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      {/* Animation Container */}
      <div className={`${config.container} relative flex items-center justify-center mb-4`}>
        <AnimatePresence mode="wait">
          {renderStatus()}
        </AnimatePresence>
      </div>

      {/* Status Message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`${config.text} font-medium text-center`}
        >
          <p className={`
            ${status === 'success' ? 'text-green-600' : ''}
            ${status === 'error' ? 'text-red-600' : ''}
            ${status === 'sending' || status === 'connecting' || status === 'verifying' ? 'text-blue-600' : ''}
            ${status === 'idle' ? 'text-gray-500' : ''}
          `}>
            {message || statusMessages[status]}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Transaction Hash Display */}
      {transactionHash && status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 px-4 py-2 bg-gray-100 rounded-lg"
        >
          <p className="text-xs text-gray-600 font-mono break-all max-w-xs">
            {transactionHash}
          </p>
        </motion.div>
      )}

      {/* Progress Indicator (for active states) */}
      {(status === 'sending' || status === 'connecting' || status === 'verifying') && (
        <motion.div
          className="mt-4 w-48 h-1 bg-gray-200 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-green-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{
              width: status === 'sending' ? '33%' : status === 'connecting' ? '66%' : '100%'
            }}
            transition={{
              duration: 0.5,
              ease: 'easeInOut'
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default VerifyAnimation;

