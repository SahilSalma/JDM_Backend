import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import {
  loginSchema,
  updateOrderStatusSchema,
  updateTrackingSchema,
  updateInventorySchema,
  updateSettingsSchema,
  sendEmailSchema,
  createBlogSchema,
  updateBlogSchema,
  changePasswordSchema,
  createShippingZoneSchema,
  updateShippingZoneSchema,
} from '../validators/admin';
import { createProductSchema, updateProductSchema } from '../validators/product';
import { uploadImages, uploadBlogImage } from '../middleware/upload';
import { uploadReviewImages as uploadReviewImagesMiddleware } from '../middleware/uploadReviewImages';

// Controllers
import { login, logout, changePassword, getStats, getSettings, updateSettings, bulkUpdateSettings, getPublicSettings } from '../controllers/adminController';
import { list as listOrders, getById as getOrderById, updateStatus, updateTracking } from '../controllers/orderController';
import { list as listProducts, create as createProduct, update as updateProduct, remove as deleteProduct, getById as getProductById, uploadImages as uploadProductImages, deleteProductImage } from '../controllers/productAdminController';
import { update as updateInventory, getLog as getInventoryLog } from '../controllers/inventoryController';
import { send as sendEmail, getTemplates, getLog as getEmailLog, getLogEntry, retryEmail, getLogByRecipient } from '../controllers/emailController';
import { adminList as listBlogPosts, getById as getBlogPostById, create as createBlogPost, update as updateBlogPost, remove as deleteBlogPost, uploadImage as uploadBlogPostImage } from '../controllers/blogController';
import { listZones, createZone, updateZone, removeZone } from '../controllers/shippingController';
import { listCustomers, getCustomerDetails } from '../controllers/customerController';
import { listReviews, getById, remove as deleteReview, update, getManualPickList, setFeatured, uploadImages as uploadReviewImages } from '../controllers/reviewController';
import { 
  getEmailTemplatesController, 
  getEmailTemplateById,
  createEmailTemplate, 
  updateEmailTemplate, 
  deleteEmailTemplate,
  getOrderNotificationRecipients,
  createOrderNotificationRecipient,
  updateOrderNotificationRecipient,
  deleteOrderNotificationRecipient,
  getSubscriptions,
  deleteSubscription,
  getNavbarSettings,
  updateNavbarSettings
} from '../controllers/emailTemplateController';

const router = Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────

router.post('/auth/login', authRateLimit, validate(loginSchema), login);
router.post('/auth/logout', logout);
router.patch('/auth/password', requireAuth, validate(changePasswordSchema), changePassword);

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get('/dashboard/stats', requireAuth, getStats);

// ─── Settings ─────────────────────────────────────────────────────────────────

router.get('/settings/public', getPublicSettings);
router.get('/settings', requireAuth, getSettings);
router.patch('/settings', requireAuth, validate(updateSettingsSchema), updateSettings);
router.put('/settings/bulk', requireAuth, bulkUpdateSettings);

// ─── Products ─────────────────────────────────────────────────────────────────

router.get('/products', requireAuth, listProducts);
router.post('/products', requireAuth, validate(createProductSchema), createProduct);
router.get('/products/:id', requireAuth, getProductById);
router.patch('/products/:id', requireAuth, validate(updateProductSchema), updateProduct);
router.delete('/products/:id', requireAuth, deleteProduct);
router.post('/products/:id/images', requireAuth, uploadImages.array('images', 10), uploadProductImages);
router.delete('/products/:id/images/:imageId', requireAuth, deleteProductImage);

// ─── Inventory ────────────────────────────────────────────────────────────────

router.patch('/inventory/:id', requireAuth, validate(updateInventorySchema), updateInventory);
router.get('/inventory/log', requireAuth, getInventoryLog);
router.get('/inventory/log/:id', requireAuth, getInventoryLog);

// ─── Orders ───────────────────────────────────────────────────────────────────

router.get('/orders', requireAuth, listOrders);
router.get('/orders/:id', requireAuth, getOrderById);
router.patch('/orders/:id', requireAuth, validate(updateOrderStatusSchema), updateStatus);
router.patch('/orders/:id/tracking', requireAuth, validate(updateTrackingSchema), updateTracking);

// ─── Email ────────────────────────────────────────────────────────────────────

router.post('/email/send', requireAuth, validate(sendEmailSchema), sendEmail);
router.get('/email/templates', requireAuth, getTemplates);
router.get('/email/log', requireAuth, getEmailLog);
router.get('/email/log/:id', requireAuth, getLogEntry);
router.post('/email/retry/:id', requireAuth, retryEmail);
router.get('/email/log/recipient/:email', requireAuth, getLogByRecipient);

// ─── Email Templates (Admin Management) ─────────────────────────────────────

router.get('/email-templates', requireAuth, getEmailTemplatesController);
router.get('/email-templates/:id', requireAuth, getEmailTemplateById);
router.post('/email-templates', requireAuth, createEmailTemplate);
router.patch('/email-templates/:id', requireAuth, updateEmailTemplate);
router.delete('/email-templates/:id', requireAuth, deleteEmailTemplate);

// ─── Order Notification Recipients ───────────────────────────────────────────

router.get('/order-notification-recipients', requireAuth, getOrderNotificationRecipients);
router.post('/order-notification-recipients', requireAuth, createOrderNotificationRecipient);
router.patch('/order-notification-recipients/:id', requireAuth, updateOrderNotificationRecipient);
router.delete('/order-notification-recipients/:id', requireAuth, deleteOrderNotificationRecipient);

// ─── Subscriptions ───────────────────────────────────────────────────────────

router.get('/subscriptions', requireAuth, getSubscriptions);
router.delete('/subscriptions/:id', requireAuth, deleteSubscription);

// ─── Makes & Models ───────────────────────────────────────────────────────────

import {
  listMakes,
  createMake,
  updateMake,
  deleteMake,
  listModels,
  createModel,
  updateModel,
  deleteModel,
} from '../controllers/vehicleController';

router.get('/makes', requireAuth, listMakes);
router.post('/makes', requireAuth, createMake);
router.patch('/makes/:id', requireAuth, updateMake);
router.delete('/makes/:id', requireAuth, deleteMake);
router.get('/models', requireAuth, listModels);
router.post('/models', requireAuth, createModel);
router.patch('/models/:id', requireAuth, updateModel);
router.delete('/models/:id', requireAuth, deleteModel);

// ─── Navbar Settings ─────────────────────────────────────────────────────────

router.get('/navbar-settings', requireAuth, getNavbarSettings);
router.put('/navbar-settings', requireAuth, updateNavbarSettings);

// ─── Blog ─────────────────────────────────────────────────────────────────────

router.get('/blog', requireAuth, listBlogPosts);
router.get('/blog/:id', requireAuth, getBlogPostById);
router.post('/blog', requireAuth, validate(createBlogSchema), createBlogPost);
router.post('/blog/upload-image', requireAuth, uploadBlogImage.single('image'), uploadBlogPostImage);
router.patch('/blog/:id', requireAuth, validate(updateBlogSchema), updateBlogPost);
router.delete('/blog/:id', requireAuth, deleteBlogPost);

// ─── Shipping Zones ──────────────────────────────────────────────────────────

router.get('/shipping-zones', requireAuth, listZones);
router.post('/shipping-zones', requireAuth, validate(createShippingZoneSchema), createZone);
router.patch('/shipping-zones/:id', requireAuth, validate(updateShippingZoneSchema), updateZone);
router.delete('/shipping-zones/:id', requireAuth, removeZone);

// ─── Customers ───────────────────────────────────────────────────────────────

router.get('/customers', requireAuth, listCustomers);
router.get('/customers/:email', requireAuth, getCustomerDetails);
// ─── Reviews ────────────────────────────────────────────────────────────────

router.get('/reviews', requireAuth, listReviews);
router.get('/reviews/:id', requireAuth, getById);
router.delete('/reviews/:id', requireAuth, deleteReview);
router.patch('/reviews/:id', requireAuth, update);
router.get('/reviews/manual-pick/list', requireAuth, getManualPickList);
router.post('/reviews/set-featured', requireAuth, setFeatured);
router.post('/reviews/upload-images', requireAuth, uploadReviewImagesMiddleware.array('images', 5), uploadReviewImages);

export default router;
