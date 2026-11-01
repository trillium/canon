/**
 * Content barrel — every user-visible string lives in a JSON file here and is
 * imported by components as a variable. Components contain no literal text.
 *
 *   import { home } from "@/content";
 *   <h1 data-content="home.heading">{home.heading}</h1>
 *
 * Export names are the page keys used in `data-content="page.section.field"`.
 * The `api*` files hold server response messages; routes read from them instead of inlining text.
 */
export { default as admin } from "./admin.json";
export { default as apiAuth } from "./api-auth.json";
export { default as apiContent } from "./api-content.json";
export { default as apiDeploy } from "./api-deploy.json";
export { default as apiFeedtack } from "./api-feedtack.json";
export { default as home } from "./home.json";
export { default as login } from "./login.json";
export { default as site } from "./site.json";
