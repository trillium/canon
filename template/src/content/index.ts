/**
 * Content barrel — every user-visible string lives in a JSON file here and is
 * imported by components as a variable. Components contain no literal text.
 *
 *   import { home } from "@/content";
 *   <h1 data-content="home.heading">{home.heading}</h1>
 *
 * Export names are the page keys used in `data-content="page.section.field"`.
 */
export { default as admin } from "./admin.json";
export { default as home } from "./home.json";
export { default as login } from "./login.json";
export { default as site } from "./site.json";
