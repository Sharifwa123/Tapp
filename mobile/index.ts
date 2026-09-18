import { setupGlobalErrorHandler } from "./src/utils/globalErrorHandler";

// This must run before anything else in the app is required. `import`
// statements are hoisted above ordinary code by the module system, so an
// `import App from './App'` placed after this call would still be
// evaluated first — pulling in every screen and native module before the
// handler exists to catch a crash in any of them. Plain `require()` calls
// are not hoisted, so this ordering is only real with them.
setupGlobalErrorHandler();

declare const require: (id: string) => any;

const { registerRootComponent } = require("expo");
const App = require("./App").default;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
