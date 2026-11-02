export default {
  preset: null,
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: false,
  forceExit: true,
  // Do NOT auto-reset/restore: module mocks (Razorpay, nodemailer) rely on
  // their implementations persisting across tests. We clear call state
  // manually inside the test files where needed.
  clearMocks: false,
  resetMocks: false,
  restoreMocks: false,
  verbose: true,
  transform: {},
  moduleNameMapper: {},
  testTimeout: 60000,
};
