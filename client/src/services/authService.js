import authCore from "./authCore.js";
import createAuthApi from "./authApi.js";
import createUserService from "./userService.js";

const authService = authCore;

Object.assign(authService, createAuthApi(authService));
Object.assign(authService, createUserService(authService));

export default authService;
