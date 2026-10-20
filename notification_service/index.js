const express = require("express");
const { notificationConsumer } = require("./config/kafka");
const { prisma } = require("../packages/database/lib/prisma");
const axios = require('axios')
const admin = require('firebase-admin');

const app = express();

app.use(express.json());

const serviceAccount = require('./firebase-service-account.json');

async function multicastNotification(notificationTitle,notificationBody,tokens){

    if (tokens.length === 0) return;

    // Define the payload structure
    const message = {
      tokens: tokens,
      notification: {
        title: notificationTitle,
        body: notificationBody
      }
    };

    // Firebase Admin SDK automatically handles authentication & optimization under the hood
    
    console.log(`[Background Worker] Firing multicast to ${tokens.length} devices...`);
    
    try{

        const response = await admin.messaging().sendEachForMulticast(message);
        
        console.log(`[Result] Successfully sent: ${response.successCount} | Failed: ${response.failureCount}`);
        
        // Database Cleaning: Capture invalid tokens to remove them from your DB
            if (response.failureCount > 0) {
                const deadTokens = [];
                response.responses.forEach((resp, index) => {
                        if (!resp.success) {
                            const errorCode = resp.error.code;
                            if (
                            errorCode === 'messaging/registration-token-not-registered' ||
                            errorCode === 'messaging/invalid-argument'
                        ) {
                            deadTokens.push(tokens[index]);
                        }
                    }
                });
    
                if (deadTokens.length > 0) {
                    console.log(`[DB Cleanup] Found ${deadTokens.length} dead tokens`);
                    // await db.removeTokensFromDatabase(deadTokens);
                }
            }
    }catch(error){
        console.error("Error sending notification:", error);
    }

}

async function notificationServiceMain(){
    await notificationConsumer.subscribe({
        topic: "notifications",
        fromBeginning: true
    })

    await notificationConsumer.run({
        eachMessage: async ({topic, partition, message}) => {

            try{

                const msg = JSON.parse(message.value.toString());
                console.log(msg);
                
                let fcm_tokens;
                let trip_created_by_student_name;
                
                if(msg.tripVisibility === "EVERYONE"){
                    // first get the studentId of the one who created tge trip then get his collegeId, then get the ids of all students from that college and then remove the d of the one who created this trip.
                    const student = await prisma.trip.findUnique({
                        where: {
                            trip_id: msg.tripId
                        },
                        include:{
                            student:{
                                select: {
                                    college_id: true,
                                    student_id: true,
                                    name:true
                                }
                            }
                        }
                    })
                    
                    trip_created_by_student_name = student.student.name;
                    
                    const allStudents = await prisma.student.findMany({
                        where: {
                            college_id: student.student.college_id,
                        },  
                        select: {
                            student_id: true,
                            fcm_token:true
                        }
                    })

                    // from all students remove the person's id who crated this trip.
                    const allStudentsWithoutRequester = allStudents.filter((student) => {
                        return student.student_id !== student.student.student_id;
                    })
                    
                    
                    // get their fcm tokens and then send notification about this trip
                    
                    fcm_tokens = allStudentsWithoutRequester.map((student) => {
                        return student.fcm_token;
                    })
                    
                    
                    
                    
                }else{
                    const student = await prisma.trip.findUnique({
                        where:{
                            trip_id:msg.tripId
                        },
                        include:{
                            student:{
                                select:{
                                    student_id:true,
                                    name:true
                                }
                            },
                            requester_visibility_list:{
                                select:{
                                    requester_id:true
                                }
                            }
                        }
                    })
                    
                    trip_created_by_student_name = student.student.name;
                    
                    // get the fcm tokens of all students in the requester visibility list and send notification
                    
                    fcm_tokens = student.requester_visibility_list.map((requester) => {
                        return requester.student.fcm_token;
                    })
                }
                
                await multicastNotification("New Trip Alert", "A new trip at" + msg.location + "on" + msg.date_of_travel + "by" + trip_created_by_student_name , fcm_tokens);
            }catch(err){
                console.log("ERROR when trying to fetch details for sending notification",err);
            }
        }
    })

}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.listen(3002,async () => {
    console.log("Notification service is running on port 3002");
    await notificationConsumer.connect();
    notificationServiceMain()
});
