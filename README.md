# Net-Bits.Net Webchat v4

### Debugging With Raws
To log raws to the web browser console use '&LOGRAWSTOBC=true' in the webchat's url.



# Modules Overview and Architecture
**nbchat_connection.ts** - Connections main module.

**nbchat_core.ts** - Core module will be present in almost all other modules; all the common classes, functions, variables should be in this module.

**nbchat_controller.ts** - Controller modules ties and orchestrates functionality in all other modules, it should have only orchestration logic (few minor exceptions are allowable if they make sense).

**ircwx_parser.ts** - parser modules contains parsing code specific to the protocol and returns structs/objects in common format that is understandable by other modules.

# Coding Guidelines
 - If there is a problem/bug/fix needed or reported for your code, fix it please. Any new person would need time to understand it and best person to fix the code is the person who has written it, hence, this rule. But this is not a hard and fast rule, it is just to keep things easier to manage.
 - Our Typescript projects follow standard guidelines and conventions of MS Typescript project: https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines . But naming for module local or function local variable like *"let parser_item = ..."* that improves readability is ok.
 - Please use '**IsUndefinedOrNull()**' function from core module to avoid problems out of null vs undefied issue. Use this function to check if object is valid instead of direct checks against 'Undefined.' For further information on null vs undefined see: https://basarat.gitbooks.io/typescript/content/docs/tips/null.html .
 - Use '**let**' instead of 'var'.
 - Use **parser_item.rval as NBChatCore.UnawayCls** for casting as this is the only form supported by JSX.
