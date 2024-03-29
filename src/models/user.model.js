import mongoose,{Schema} from "mongoose";

const userSchema = new Schema(
  {
     name: {
      type: String,
      required: [true,"Please enter your name."]
     },
     email: {
      type:String,
      required:[true,"Please enter your email."],
      unique:[true,"Email Already Exists."],
      lowercase:true,
      trim:true,
    },
    photo: {
      type : String, // cloudinaryURL
      required:[true,"Please do add your profile picture."],
    },
    role: {
      type : String, 
      enum : ["user","admin"],
      default : "user",
    },
    gender: {
      type:String,
      enum : ["male","female","others"],
    },
    dob: {
      type : Date,
      required : [true,"Please enter your birth date."],
    },
  },
  {
    timestamps:true
  }
);

// Define a virtual attribute 'fullName'
userSchema.virtual('age').get(function () {
  const today = new Date();
  const dob = this.dob;

  let age = today.getFullYear() - dob.getFullYear();

  if(today.getMonth()<dob.getMonth() || 
  today.getMonth() === dob.getMonth 
  && today.getDate<dob.getDate()) {
    age--;
  }

  return age;
});

export const User = mongoose.model("User",userSchema)