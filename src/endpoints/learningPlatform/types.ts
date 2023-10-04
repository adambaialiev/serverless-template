export interface Lesson {
	id: string;
	videoUrl: string;
	imageUrl: string;
	description: string;
}

export interface Lessons {
	lessons: Lesson[];
}
