"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const blogController_1 = require("../controllers/blogController");
const router = (0, express_1.Router)();
// Public blog routes
router.get('/', blogController_1.list);
router.get('/:slug', blogController_1.getBySlug);
exports.default = router;
//# sourceMappingURL=blog.js.map