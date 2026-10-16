import { openDatabase } from '../database.js';
import { courses } from '../seeds/textbooks/courses.js';
import { validateCourse } from '../src/learning-apps/practice/domain.js';
courses.forEach(validateCourse);
const db=await openDatabase();
try {
  await db.importCourses(courses);
  const stored=await db.getCourses();
  console.log(`教材导入完成：${stored.length} 门课程，${stored.reduce((sum,course)=>sum+course.units.length,0)} 个单元；已有教材及学习记录保留。`);
} finally {await db.close();}
