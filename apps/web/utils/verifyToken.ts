import jwt from "jsonwebtoken";
export const verifyAdminToken = (token:string)=>{
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET!) as {
            ifsc: any;id:string,email:string,name:string,type:string
};
        return {success:true,data:decoded};
    }
    catch(err){
        return {success:false,message:"Invalid token"}
    }
}