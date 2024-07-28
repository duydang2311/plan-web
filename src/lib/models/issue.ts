export interface Issue {
	createdTime: string;
	updatedTime: string;
	id: string;
	authorId: string;
	orderNumber: number;
	title: string;
	description?: string;
}
