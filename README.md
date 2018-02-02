# es-style

## 快速体验

```shell
npm install
npm run dev
npm run test_project
```

babel 配置
```json
{
	"plugins": [
		"es-style/babel",
		{
			"extensions": [
				".scss"
			],
			"sassOptions": {
				"includePaths": [
					"styles/"
				],
				"precision": 2
			},
			"plugins": [
				[
					"postcss-cssnext",
					{
						"warnForDuplicates": false
					}
				],
				[
					"postcss-modules",
					{
						"awardCssModules": true,
						"scopeBehaviour": "local",
						"generateScopedName": "[name]_[local]_[hash:base64:5]]"
					}
				],
				"autoprefixer",
				"cssnano"
			]
		}
	]
}
```