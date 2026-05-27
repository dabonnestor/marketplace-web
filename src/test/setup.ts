import "@testing-library/jest-dom/vitest"

// jsdom doesn't support pointer events or scrollIntoView, which Radix UI uses
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
