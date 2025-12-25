const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { createBackendClient } = require('./backendClient');
const { TTLCache } = require('./cache');
const { promisePool } = require('./pool');
const { computeDrugRiskV2 } = require('./risk');

const PORT = Number(process.env.PORT || 5055);
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5000/api';
const BACKEND_SERVICE_TOKEN = process.env.BACKEND_SERVICE_TOKEN || '';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 60000);
const CONCURRENCY = Number(process.env.CONCURRENCY || 6);

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(morgan('tiny'));

const trustCache = new TTLCache({ ttlMs: CACHE_TTL_MS });
const reviewCache = new TTLCache({ ttlMs: CACHE_TTL_MS });

function getAuthorization(req) {
  const auth = req.headers.authorization;
  if (auth && typeof auth === 'string' && auth.trim() !== '') return auth;
  if (BACKEND_SERVICE_TOKEN) return `Bearer ${BACKEND_SERVICE_TOKEN}`;
  return null;
}

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'ai-risk',
    backend: BACKEND_API_URL,
    ts: new Date().toISOString()
  });
});

app.get('/risk/drugs', async (req, res) => {
  try {
    const authorization = getAuthorization(req);
    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: 'Missing Authorization (or BACKEND_SERVICE_TOKEN)'
      });
    }

    const client = createBackendClient({ backendApiUrl: BACKEND_API_URL, authorization });

    // 1) Fetch drugs page from backend
    const params = { ...req.query };
    const drugsResp = await client.get('/drugs', { params });
    const payload = drugsResp.data;
    if (!payload?.success) {
      return res.status(502).json({
        success: false,
        message: payload?.message || 'Backend /drugs failed',
        backend: payload
      });
    }

    const drugs = payload?.data?.drugs || [];
    const pagination = payload?.data?.pagination || null;

    // 2) Fetch QR scan stats once (best-effort)
    let qrScanStats = null;
    try {
      const qrResp = await client.get('/reports/module/qr-scans', { params: {} });
      if (qrResp.data?.success) qrScanStats = qrResp.data?.data || null;
    } catch (_) {
      qrScanStats = null;
    }

    // Build lightweight QR signals map from "recent"
    const qrSignalsByDrugId = new Map();
    if (qrScanStats?.recent && Array.isArray(qrScanStats.recent)) {
      for (const scan of qrScanStats.recent) {
        const drugId = scan?.drugId || scan?.drug?.drugId || null;
        if (!drugId) continue;
        const prev = qrSignalsByDrugId.get(drugId) || { recentTotal: 0, recentFails: 0 };
        prev.recentTotal += 1;
        if (!scan?.success) prev.recentFails += 1;
        qrSignalsByDrugId.set(drugId, prev);
      }
    }

    // 3) Enrich trust score & review stats (best-effort, cached)
    const enriched = await promisePool(
      drugs,
      async (drug) => {
        const manufacturerId =
          (typeof drug?.manufacturerId === 'string' ? drug.manufacturerId : drug?.manufacturerId?._id) || null;
        const drugMongoId = (typeof drug?._id === 'string' ? drug._id : null) || null;

        // Trust
        let supplierTrust = null;
        if (manufacturerId) {
          const trustKey = `trust:${manufacturerId}`;
          supplierTrust = trustCache.get(trustKey);
          if (!supplierTrust) {
            try {
              const trustResp = await client.get(`/trust-scores/${manufacturerId}`);
              if (trustResp.data?.success) {
                supplierTrust = trustResp.data?.data || trustResp.data?.data?.trustScore || trustResp.data?.data;
                // Normalize common shape: { trustScore, trustLevel }
                if (trustResp.data?.data?.trustScore != null) {
                  supplierTrust = {
                    trustScore: trustResp.data.data.trustScore,
                    trustLevel: trustResp.data.data.trustLevel
                  };
                }
              }
            } catch (_) {
              supplierTrust = null;
            }
            trustCache.set(trustKey, supplierTrust);
          }
        }

        // Reviews
        let reviewStats = null;
        if (drugMongoId) {
          const reviewKey = `review:drug:${drugMongoId}`;
          reviewStats = reviewCache.get(reviewKey);
          if (!reviewStats) {
            try {
              const revResp = await client.get(`/reviews/stats/drug/${drugMongoId}`);
              if (revResp.data?.success) {
                // Controller thường trả về { totalReviews, averageRating, ratingDistribution, ... }
                const raw = revResp.data?.data?.stats || revResp.data?.data || revResp.data;
                // Normalize fields used by risk
                reviewStats = {
                  totalReviews: raw?.totalReviews ?? raw?.total ?? 0,
                  averageRating: raw?.averageRating ?? null,
                  negativeRatio: raw?.negativeRatio ?? 0,
                  ratingDistribution: raw?.ratingDistribution
                };
              }
            } catch (_) {
              reviewStats = null;
            }
            reviewCache.set(reviewKey, reviewStats);
          }
        }

        const qrSignals = qrSignalsByDrugId.get(drug?.drugId) || { recentTotal: 0, recentFails: 0 };
        const risk = computeDrugRiskV2({ drug, supplierTrust, reviewStats, qrSignals });

        return {
          ...drug,
          risk
        };
      },
      CONCURRENCY
    );

    return res.json({
      success: true,
      data: {
        drugs: enriched,
        pagination
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'AI service error',
      error: error?.message
    });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[ai-service] listening on :${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[ai-service] backend: ${BACKEND_API_URL}`);
});


