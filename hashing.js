import bcrypt from "bcryptjs";

//generating hash password
let password = "Password@123";
let hashedPassword = await bcrypt.hash(password, 10); //salt 10
console.log(hashedPassword);

//password comparision
let loginPassword = "Password@123";
let comparePassword = await bcrypt.compare(loginPassword, hashedPassword);
console.log(comparePassword);
