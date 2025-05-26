import { Student, Grade } from "./models.ts";
import { DatabaseService } from "./db.ts";

export class StudentController {
  constructor(private dbService: DatabaseService) {}

  async getAllStudents(): Promise<Student[]> {
    const students = await this.dbService.studentsCollection.find({}, { projection: { _id: 0 } }).toArray();
    return students;
  }

  async upsertGrade(imie: string, nazwisko: string, subject: string, grade: number): Promise<void> {
    const filter = {
      name: { $regex: `^${imie}$`, $options: "i" },
      surname: { $regex: `^${nazwisko}$`, $options: "i" }
    };

    const student = await this.dbService.studentsCollection.findOne(filter);
    if (!student) throw new Error(`Student ${imie} ${nazwisko} nie istnieje w bazie`);

    let matchedSubject: string | undefined;

    const hasSubject = Array.isArray(student.grades) && student.grades.some((g: Grade) => {
      if (g.subject.toLowerCase() === subject.toLowerCase()) {
        matchedSubject = g.subject;
        return true;
      }
      return false;
    });

    if (hasSubject) {
      await this.dbService.studentsCollection.updateOne(
        filter,
        { $set: { "grades.$[elem].grade": grade } },
        { arrayFilters: [{ "elem.subject": matchedSubject }] },
      );
    } else {
      await this.dbService.studentsCollection.updateOne(
        filter,
        { $push: { grades: { subject, grade } } },
      );
    }
  }
}
