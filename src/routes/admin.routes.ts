
import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { addparent, addstudent, addteacher, createAdmin, createClass, 
      createSubject, deleteClass, deleteSubject, deleteuser, getAllClasses,
      getMessages,
      getOrCreateDM,
      getParents, getStatistics, getStudentById, getStudents, getSubjects,
      getTeacherById, getTeacherIdsWithRole, getTeachers, sendMessageREST, updateParent,
      updateStudent, updateSubject, updateTeacher } from "../controllers/admin.controller.js";
const adminRouter = Router()

//get stats
adminRouter.get("/statistics",authMiddleware,roleMiddleware(["admin"]), getStatistics);

//create Admin
adminRouter.post("/addadmin",createAdmin)

//class
adminRouter.post("/classes", authMiddleware,roleMiddleware(["admin"]),createClass);
adminRouter.get("/classes", authMiddleware,roleMiddleware(["admin","teacher","student"]),getAllClasses);
adminRouter.delete("/deleteclass/:id",authMiddleware,roleMiddleware(["admin"]),deleteClass)


//teacher
adminRouter.put("/updateteacher/:id",authMiddleware,roleMiddleware(["admin"]), upload.single("image"),updateTeacher)
adminRouter.post("/addteacher",authMiddleware,roleMiddleware(["admin"]), upload.single("image"),addteacher)
adminRouter.get("/getteacherbyid/:id",authMiddleware,roleMiddleware(["admin"]),getTeacherById)
adminRouter.get("/getteachers",authMiddleware,getTeachers)
//parent
adminRouter.put("/updateparent/:id",authMiddleware,roleMiddleware(["admin"]),updateParent)
adminRouter.post("/addparent",authMiddleware,roleMiddleware(["admin"]),addparent)
adminRouter.get("/getparents",authMiddleware,roleMiddleware(["admin","teacher"]),getParents)
//student
adminRouter.put("/updatestudent/:id",authMiddleware,roleMiddleware(["admin"]), upload.single("image"),updateStudent)
adminRouter.get("/getstudentbyid/:id",authMiddleware,roleMiddleware(["admin","teacher"]),getStudentById)
adminRouter.get("/getstudents",authMiddleware,roleMiddleware(["admin","teacher"]),getStudents)
adminRouter.post("/addstudent",authMiddleware,roleMiddleware(["admin"]), upload.single("image"),addstudent)
//subjects
adminRouter.post("/addsubject",authMiddleware,roleMiddleware(["admin"]),createSubject)
adminRouter.get("/getsubjects", getSubjects,);
adminRouter.get("/teacher-ids-role",authMiddleware,roleMiddleware(["admin"]),getTeacherIdsWithRole)
adminRouter.put("/updatesubject/:id",authMiddleware,roleMiddleware(["admin"]),updateSubject)




// adminRouter.post("/addsubject",authMiddleware,roleMiddleware(["admin"]),createSubject)

adminRouter.delete("/delete/:id",authMiddleware,roleMiddleware(["admin"]),deleteuser)
adminRouter.delete("/deletesubject/:id",authMiddleware,roleMiddleware(["admin"]),deleteSubject)


//chat
adminRouter.post("/dm",authMiddleware,getOrCreateDM)
// GET messages (with pagination)
adminRouter.get("/:conversationId/messages",authMiddleware,getMessages);

// SEND message
adminRouter.post("/:conversationId/messages",authMiddleware,sendMessageREST);

export default adminRouter
