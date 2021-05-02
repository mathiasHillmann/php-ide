# PHP IDE

Overcharge your Vscode and turn it into a proper PHP IDE.

## Features

### Php-CS-Fixer

Make sure your code automatically matches standarts both in PHP-FIG and in another frameworks by automatically using `php-cs-fixer fix` every time you save your files

![php-cs-fixer in action](readme/php-cs-fixer.gif?raw=true "php-cs-fixer in action")

## Requirements

PHP installed and included in PATH.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `php-cs-fixer.toolPath`: The path to a local `php-cs-fixer` tool not included by the extension in case you want to use it locally. Default: ""
* `php-cs-fixer.useCache`: Whether to use cache when running `php-cs-fixer` or not. Default: `false`
* `php-cs-fixer.allowRisky`: Whether `php-cs-fixer` is allowed risky fixes or not. Default: `false`
* `php-cs-fixer.config`: Path to a local .php_cs file. Default: ""
* `php-cs-fixer.rules`: Rules to be used for formatting your PHP file. Default: "@PSR1,@PSR2,@Symfony,-yoda_style". List of possible rules: [Link](https://github.com/FriendsOfPHP/PHP-CS-Fixer/blob/2.18/doc/ruleSets/index.rst)
* `php-cs-fixer.fixOnSave`: Whether to use `php-cs-fixer` when you save your file. Default: `true`

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

### 0.1.0

Initial Release

## Projects used in this extension

* [FriendsOfPHP/PHP-CS-Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer)
