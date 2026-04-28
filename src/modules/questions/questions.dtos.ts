
export type QuestionType = 'open' | 'boolean' | 'numeric' | 'range' | 'evidence' | 'multiple';

export interface CreateQuestionOptionDto {
    option_text: string;
    option_value_numeric?: number;
    option_value_text?: string;
    option_order: number;
}

export interface CreateQuestionDto {
    id_user: number;
    question: string;
    question_type: QuestionType;
    min_value?: number;
    max_value?: number;
    max_photos?: number;
    options: CreateQuestionOptionDto[];
    clients?: number[];
}