"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const validate_1 = require("../middleware/validate");
const admin_1 = require("../validators/admin");
const product_1 = require("../validators/product");
const upload_1 = require("../middleware/upload");
const uploadReviewImages_1 = require("../middleware/uploadReviewImages");
// Controllers
const adminController_1 = require("../controllers/adminController");
const orderController_1 = require("../controllers/orderController");
const productAdminController_1 = require("../controllers/productAdminController");
const inventoryController_1 = require("../controllers/inventoryController");
const emailController_1 = require("../controllers/emailController");
const blogController_1 = require("../controllers/blogController");
const shippingController_1 = require("../controllers/shippingController");
const customerController_1 = require("../controllers/customerController");
const reviewController_1 = require("../controllers/reviewController");
const emailTemplateController_1 = require("../controllers/emailTemplateController");
const router = (0, express_1.Router)();
// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/login', rateLimit_1.authRateLimit, (0, validate_1.validate)(admin_1.loginSchema), adminController_1.login);
router.post('/auth/logout', adminController_1.logout);
router.patch('/auth/password', auth_1.requireAuth, (0, validate_1.validate)(admin_1.changePasswordSchema), adminController_1.changePassword);
// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard/stats', auth_1.requireAuth, adminController_1.getStats);
// ─── Settings ─────────────────────────────────────────────────────────────────
router.get('/settings/public', adminController_1.getPublicSettings);
router.get('/settings', auth_1.requireAuth, adminController_1.getSettings);
router.patch('/settings', auth_1.requireAuth, (0, validate_1.validate)(admin_1.updateSettingsSchema), adminController_1.updateSettings);
router.put('/settings/bulk', auth_1.requireAuth, adminController_1.bulkUpdateSettings);
// ─── Products ─────────────────────────────────────────────────────────────────
router.get('/products', auth_1.requireAuth, productAdminController_1.list);
router.post('/products', auth_1.requireAuth, (0, validate_1.validate)(product_1.createProductSchema), productAdminController_1.create);
router.get('/products/:id', auth_1.requireAuth, productAdminController_1.getById);
router.patch('/products/:id', auth_1.requireAuth, (0, validate_1.validate)(product_1.updateProductSchema), productAdminController_1.update);
router.delete('/products/:id', auth_1.requireAuth, productAdminController_1.remove);
router.post('/products/:id/images', auth_1.requireAuth, upload_1.uploadImages.array('images', 10), productAdminController_1.uploadImages);
router.delete('/products/:id/images/:imageId', auth_1.requireAuth, productAdminController_1.deleteProductImage);
// ─── Inventory ────────────────────────────────────────────────────────────────
router.patch('/inventory/:id', auth_1.requireAuth, (0, validate_1.validate)(admin_1.updateInventorySchema), inventoryController_1.update);
router.get('/inventory/log', auth_1.requireAuth, inventoryController_1.getLog);
router.get('/inventory/log/:id', auth_1.requireAuth, inventoryController_1.getLog);
// ─── Orders ───────────────────────────────────────────────────────────────────
router.get('/orders', auth_1.requireAuth, orderController_1.list);
router.get('/orders/:id', auth_1.requireAuth, orderController_1.getById);
router.patch('/orders/:id', auth_1.requireAuth, (0, validate_1.validate)(admin_1.updateOrderStatusSchema), orderController_1.updateStatus);
router.patch('/orders/:id/tracking', auth_1.requireAuth, (0, validate_1.validate)(admin_1.updateTrackingSchema), orderController_1.updateTracking);
// ─── Email ────────────────────────────────────────────────────────────────────
router.post('/email/send', auth_1.requireAuth, (0, validate_1.validate)(admin_1.sendEmailSchema), emailController_1.send);
router.get('/email/templates', auth_1.requireAuth, emailController_1.getTemplates);
router.get('/email/log', auth_1.requireAuth, emailController_1.getLog);
router.get('/email/log/:id', auth_1.requireAuth, emailController_1.getLogEntry);
router.post('/email/retry/:id', auth_1.requireAuth, emailController_1.retryEmail);
router.get('/email/log/recipient/:email', auth_1.requireAuth, emailController_1.getLogByRecipient);
// ─── Email Templates (Admin Management) ─────────────────────────────────────
router.get('/email-templates', auth_1.requireAuth, emailTemplateController_1.getEmailTemplatesController);
router.get('/email-templates/:id', auth_1.requireAuth, emailTemplateController_1.getEmailTemplateById);
router.post('/email-templates', auth_1.requireAuth, emailTemplateController_1.createEmailTemplate);
router.patch('/email-templates/:id', auth_1.requireAuth, emailTemplateController_1.updateEmailTemplate);
router.delete('/email-templates/:id', auth_1.requireAuth, emailTemplateController_1.deleteEmailTemplate);
// ─── Order Notification Recipients ───────────────────────────────────────────
router.get('/order-notification-recipients', auth_1.requireAuth, emailTemplateController_1.getOrderNotificationRecipients);
router.post('/order-notification-recipients', auth_1.requireAuth, emailTemplateController_1.createOrderNotificationRecipient);
router.patch('/order-notification-recipients/:id', auth_1.requireAuth, emailTemplateController_1.updateOrderNotificationRecipient);
router.delete('/order-notification-recipients/:id', auth_1.requireAuth, emailTemplateController_1.deleteOrderNotificationRecipient);
// ─── Subscriptions ───────────────────────────────────────────────────────────
router.get('/subscriptions', auth_1.requireAuth, emailTemplateController_1.getSubscriptions);
router.delete('/subscriptions/:id', auth_1.requireAuth, emailTemplateController_1.deleteSubscription);
// ─── Makes & Models ───────────────────────────────────────────────────────────
const vehicleController_1 = require("../controllers/vehicleController");
router.get('/makes', auth_1.requireAuth, vehicleController_1.listMakes);
router.post('/makes', auth_1.requireAuth, vehicleController_1.createMake);
router.patch('/makes/:id', auth_1.requireAuth, vehicleController_1.updateMake);
router.delete('/makes/:id', auth_1.requireAuth, vehicleController_1.deleteMake);
router.get('/models', auth_1.requireAuth, vehicleController_1.listModels);
router.post('/models', auth_1.requireAuth, vehicleController_1.createModel);
router.patch('/models/:id', auth_1.requireAuth, vehicleController_1.updateModel);
router.delete('/models/:id', auth_1.requireAuth, vehicleController_1.deleteModel);
// ─── Navbar Settings ─────────────────────────────────────────────────────────
router.get('/navbar-settings', auth_1.requireAuth, emailTemplateController_1.getNavbarSettings);
router.put('/navbar-settings', auth_1.requireAuth, emailTemplateController_1.updateNavbarSettings);
// ─── Blog ─────────────────────────────────────────────────────────────────────
router.get('/blog', auth_1.requireAuth, blogController_1.adminList);
router.get('/blog/:id', auth_1.requireAuth, blogController_1.getById);
router.post('/blog', auth_1.requireAuth, (0, validate_1.validate)(admin_1.createBlogSchema), blogController_1.create);
router.post('/blog/upload-image', auth_1.requireAuth, upload_1.uploadBlogImage.single('image'), blogController_1.uploadImage);
router.patch('/blog/:id', auth_1.requireAuth, (0, validate_1.validate)(admin_1.updateBlogSchema), blogController_1.update);
router.delete('/blog/:id', auth_1.requireAuth, blogController_1.remove);
// ─── Shipping Zones ──────────────────────────────────────────────────────────
router.get('/shipping-zones', auth_1.requireAuth, shippingController_1.listZones);
router.post('/shipping-zones', auth_1.requireAuth, (0, validate_1.validate)(admin_1.createShippingZoneSchema), shippingController_1.createZone);
router.patch('/shipping-zones/:id', auth_1.requireAuth, (0, validate_1.validate)(admin_1.updateShippingZoneSchema), shippingController_1.updateZone);
router.delete('/shipping-zones/:id', auth_1.requireAuth, shippingController_1.removeZone);
// ─── Customers ───────────────────────────────────────────────────────────────
router.get('/customers', auth_1.requireAuth, customerController_1.listCustomers);
router.get('/customers/:email', auth_1.requireAuth, customerController_1.getCustomerDetails);
// ─── Reviews ────────────────────────────────────────────────────────────────
router.get('/reviews', auth_1.requireAuth, reviewController_1.listReviews);
router.get('/reviews/:id', auth_1.requireAuth, reviewController_1.getById);
router.delete('/reviews/:id', auth_1.requireAuth, reviewController_1.remove);
router.patch('/reviews/:id', auth_1.requireAuth, reviewController_1.update);
router.get('/reviews/manual-pick/list', auth_1.requireAuth, reviewController_1.getManualPickList);
router.post('/reviews/set-featured', auth_1.requireAuth, reviewController_1.setFeatured);
router.post('/reviews/upload-images', auth_1.requireAuth, uploadReviewImages_1.uploadReviewImages.array('images', 5), reviewController_1.uploadImages);
exports.default = router;
//# sourceMappingURL=admin.js.map