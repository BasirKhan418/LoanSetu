import jwt from "jsonwebtoken";
export const verifyAdminToken = (token:string)=>{
    try{
        console.log("JWT Secret: FOR VERIFY",process.env.JWT_SECRET);
        const decoded = jwt.verify(token,process.env.JWT_SECRET!) as {
            ifsc: any;id:string,email:string,name:string,type:string
};
        return {success:true,data:decoded};
    }
    catch(err){
        console.log("Error verifying token:", err);
        return {success:false,message:"Invalid token"}
    }
}