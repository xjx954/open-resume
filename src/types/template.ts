export interface TemplateItem {
  id: number;
  title: string;
  thumbnail: string;
  template: string;
  author: string;
  avatar: string;
  theme: string;
  collect: number;
  updateTime: number;
  category: string;
  tags: string[];
  level: "student" | "junior" | "mid" | "senior" | "general";
  role: string;
  description: string;
  recommended?: boolean;
}

export type TemplateWithTheme = TemplateItem & {
  themeColor: string;
};
