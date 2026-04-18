export type CustomIcon =
	| {
			type: "svg";
			value: string;
			collection?: string;
			name: string;
	  }
	| {
			type: "iconify";
			value: string;
			collection: string;
			name: string;
	  };
