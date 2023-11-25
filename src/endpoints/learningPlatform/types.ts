export interface Lesson {
	id: string;
	videoUrl: string;
	imageUrl: string;
	description: string;
	duration: string;
}

export interface Lessons {
	lessons: Lesson[];
}
