# terraria-scrapper

Extracts information from Terraria official wiki. Information collected: weapons and ammo, prefixes.
If you want the data itself, please see https://www.npmjs.com/package/terraria-data

## Usage

Parsing executes in several steps each producing intermediate results in working folder. Intermediate results are not deleted afterwards but are overwritten
with repeated execution. Most useful data is collected then in `<output root>/json/joined` folder.

### Configuration

Enabled steps can be configured in `data/config.json`, certain paths and options in `data/entry.json`. By default, all steps are **disabled**.

### Preparation

The project uses typescript and should be compiled before execution.

```
    npm run build
```

Also, required parsing stages should be enabled manually in the config file. Note that some stages use results from previous stages.

### Execution

```
    npm run scrap
```
