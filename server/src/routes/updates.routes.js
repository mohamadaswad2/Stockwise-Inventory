const router = require('express').Router();
const c      = require('../controllers/updates.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

// ── Public (no auth required) ─────────────────────────────────────────────────
router.get('/',            c.list);
router.post('/:id/like',   c.likeUpdate);

// ── Admin only ────────────────────────────────────────────────────────────────
router.get('/admin',         authenticate, requireAdmin, c.adminList);
router.post('/admin',        authenticate, requireAdmin, c.adminCreate);
router.put('/admin/:id',     authenticate, requireAdmin, c.adminUpdate);
router.delete('/admin/:id',  authenticate, requireAdmin, c.adminDelete);

module.exports = router;
