import React, { useState, useEffect } from 'react';
import { VerifyAnimation } from './index';
import { Button } from '../../components/ui'; // Assuming you might have a Button component, or use regular button

/**
 * Demo component to showcase VerifyAnimation
 * This can be used for testing or as a reference
 */
const VerifyAnimationDemo = () => {
  const [status, setStatus] = useState('idle');
  const [transactionHash, setTransactionHash] = useState(null);

  const statuses = ['idle', 'sending', 'connecting', 'verifying', 'success', 'error'];

  const handleStartVerification = () => {
    setStatus('sending');
    setTransactionHash('0x' + Math.random().toString(16).substr(2, 64));

    // Simulate verification process
    setTimeout(() => setStatus('connecting'), 1000);
    setTimeout(() => setStatus('verifying'), 2500);
    setTimeout(() => {
      // Randomly choose success or error for demo
      const isSuccess = Math.random() > 0.3;
      setStatus(isSuccess ? 'success' : 'error');
    }, 4000);
  };

  const handleReset = () => {
    setStatus('idle');
    setTransactionHash(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            VerifyAnimation Component Demo
          </h1>
          <p className="text-gray-600 mb-8">
            Visualize blockchain verification process with smooth animations
          </p>

          {/* Main Animation Display */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-12 mb-8">
            <VerifyAnimation
              status={status}
              transactionHash={transactionHash}
              size="large"
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Status Controls
              </h2>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatus(s);
                      if (s !== 'idle') {
                        setTransactionHash('0x' + Math.random().toString(16).substr(2, 64));
                      } else {
                        setTransactionHash(null);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      status === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleStartVerification}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Start Verification Flow
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Current Status Info */}
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Current Status:</span>{' '}
                <span className="text-gray-900">{status}</span>
              </p>
              {transactionHash && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-semibold">Transaction Hash:</span>{' '}
                  <span className="text-gray-900 font-mono">{transactionHash}</span>
                </p>
              )}
            </div>
          </div>

          {/* Size Variants Demo */}
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Size Variants
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['small', 'medium', 'large'].map((size) => (
                <div key={size} className="bg-gray-50 rounded-lg p-6 text-center">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 capitalize">
                    {size}
                  </h3>
                  <VerifyAnimation
                    status="verifying"
                    size={size}
                    message={`${size} size`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyAnimationDemo;

