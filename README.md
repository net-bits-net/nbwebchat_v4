# Net-Bits.Net Webchat v4
It is a feature rich open source live webchat client based on ircWx protocol. Completely cross platform (works on Windows, MAC, and Linux and their popular browsers), and secure. Its main features include multi-language (Unicode) support, formatting, user preference settings, whispers (private messaging) in, ignore/unignore, tagging, status icons, profile icons, and many more features.

[//]: # "**Founder/Architect:** Habib Y.H. ( https://github.com/net-bitsDotNet )"

**Project Lead:** Mike McAlpin ( https://github.com/err0r007 )

Working demo: http://www.ircwx.com/c/?cn=ircWx%5cbCafe

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

# Debugging With Raws
To log raws to the web browser console use '&LOGRAWSTOBC=true' in the webchat's url.

# Working Directories Strucuture
Git file is not working files structure, following is asp.net/IIS directories and files structure.
#### Webchat folder:
![web chat folder](https://github.com/net-bits-net/nbwebchat_v4/raw/master/HelpDocs/images/webchat_folder.png)
#### Webchat page view folder: 
![web chat page view](https://github.com/net-bits-net/nbwebchat_v4/raw/master/HelpDocs/images/webchat_view_file.png)
