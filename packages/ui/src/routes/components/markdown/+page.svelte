<script lang="ts">
	import { Markdown } from "$lib";

	import Preview from "../_components/preview.svelte";

	const value = `# Heading 1
## Heading 2
### Heading 3

Text  
_Italics_  
**Bold**  
**_Bold italics_**  
~~Strikethrough~~  
[Link](/)  
\`console.log("Hello world!");\`  
||This is a spoiler||

---

> This is a quote
 
- This
- is
    - an
    - unordered
- list

1. This
2. is
    1. an
    2. ordered
3. list`;
</script>

<Preview title="Markdown">
	<div class="w-full">
		<Markdown {value} />
	</div>
</Preview>
