export interface Grade {
  subject: string;
  grade: number;
}

export interface Student {
  _id: string;
  name: string;
  surname: string;
  grades?: Grade[];
}
