var restify = require('restify');
var builder = require('botbuilder');
var azure = require('botbuilder-azure'); 
var azurestorage = require('azure-storage');
var builder_cognitiveservices = require('botbuilder-cognitiveservices');
var https = require('https');
var request = require('request');
var rp = require('request-promise');
var motivation = require("motivation");

var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

var tone_analyzer = new ToneAnalyzerV3({
  username: "6c217e88-87a7-4f61-97b2-70ae74e165d3",
  password: "xBO5QFA3lhzO",
  version_date: '2017-09-21'
});

var header = {'Content-Type':'application/json', 'Ocp-Apim-Subscription-Key':'8eab008afd1a42138ba9f23f2f1fda63'}
var requestUrl = 'https://southeastasia.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment';
var task;

var AZURE_STORAGE_ACCOUNT = "chatbotimaginehack";
var AZURE_STORAGE_ACCESS_KEY = "rNJNyHB3mh5yd0kgf2gIFKQ9pgxyWe5OzTla0GrBhPRK94LiEllNPkYHc4eHZ9rUehLF4B3VAB71PVVWdZGNsg==";
var tableSvc = azurestorage.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);

tableSvc.createTableIfNotExists('ScoreTable', function(error, result, response){
  if(!error){
    // Table exists or created
  }
});

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
console.log('%s listening to %s', server.name, server.url);
});
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: "92129e20-3f64-4aed-806d-0cd2c7c7d8cb",
    appPassword: "zvzGUB64mjjjMSGW759}[}_"  
});

// Listen for messages from users
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());
//var exe;

const LuisModelUrl = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/911d1e5e-086b-4341-9cc6-9827bc186a12?subscription-key=7aeea59a16a5467aacff93989cd145f5&verbose=true&timezoneOffset=0&q=";
var Recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [Recognizer] });

var x = 1;
// setting up QnA Maker
var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: '695169f1-b6b3-4a6d-9f9c-5079490e6eec', // process.env.QnAKnowledgebaseId, 
    subscriptionKey: '28beda6a7ff54b0db4e7b8da16f77801'
}); //process.env.QnASubscriptionKey});
if (x == 1) {
    var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
        recognizers: [recognizer],
        defaultMessage: 'Sorry, I don\'t get you. Please try again.',
        qnaThreshold: 0.3
    }
    );
    //x = 2;
}

var timings=false;
var count=0;

// Bot introduces itself and says hello upon conversation start
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded[0].id === message.address.bot.id) {
        var reply = new builder.Message()
                .address(message.address)
                .text("This is Chatbot speaking! May I know your name?");
        bot.send(reply);
    }
});
//var x = 1;
bot.dialog('/', basicQnAMakerDialog);
var name;
basicQnAMakerDialog.defaultWaitNextMessage = function (session, qnaMakerResult) {
    var question = session.message.text;
    session.conversationData.userQuestion = question;
    if (!qnaMakerResult.answers && x==1) {
        let msg = "Oh never mind, got it.I have saved your name. Your saved name is: ";
        name = session.message.text;
        session.send(msg + session.message.text);
        x = 2;

       
    }
}


// setting up conversation
basicQnAMakerDialog.respondFromQnAMakerResult = function(session, qnaMakerResult){
    // Save the question
    var question = session.message.text;
    session.conversationData.userQuestion = question;

    // boolean to check 
    var mystart = qnaMakerResult.answers[0].answer.includes(';');
    var startchoice = qnaMakerResult.answers[0].answer.includes('~');
    var history = qnaMakerResult.answers[0].answer.includes('$');
    var video = qnaMakerResult.answers[0].answer.includes('*');
    var goodbad= qnaMakerResult.answers[0].answer.includes('^');
    var wod= qnaMakerResult.answers[0].answer.includes('#');
    var news = qnaMakerResult.answers[0].answer.includes('{');


    if(!mystart && !startchoice && !history && !video && !goodbad && !wod && !news){
        // Not special character, send a normal text response 
        session.send(qnaMakerResult.answers[0].answer).endDialog;
        timings = false;

    }








    else if (qnaMakerResult.answers && qnaMakerResult.score >= 0.5 && mystart) {
        timings=false;
        var qnaAnswer = qnaMakerResult.answers[0].answer;
        
                var qnaAnswerData = qnaAnswer.split(';');
                var title = qnaAnswerData[0];
                var description = qnaAnswerData[1];
                var url = qnaAnswerData[2];
                var imageURL = qnaAnswerData[3];
                var title2 = qnaAnswerData[4];
                var description2 = qnaAnswerData[5];
                var url2 = qnaAnswerData[6];
                var imageURL2 = qnaAnswerData[7];
                var b3=qnaAnswerData[9];
                var title3= qnaAnswerData[8];
                var msg = new builder.Message(session)
                msg.attachments([
                    new builder.HeroCard(session)
                    .title(title)
                    .subtitle(description)
                    .images([builder.CardImage.create(session, imageURL)])
                   /* .buttons([
                        builder.CardAction.openUrl(session, url, "Learn More")
                    ]),
                    new builder.HeroCard(session)
                    .title(title2)
                    .subtitle(description2)
                    .images([builder.CardImage.create(session, imageURL2)])
                    .buttons([
                        builder.CardAction.openUrl(session, url2, "Learn More")
                    ])*/,
                    new builder.HeroCard(session)
                    .title(title3)
                    .buttons([
                        builder.CardAction.imBack(session, 'I am done!', b3)
                    ])
                ]);
        }//---------------------------------------For inclusion of "~" as a special character--------------------------------------------------------
 
    else if(qnaMakerResult.answers && qnaMakerResult.score >= 0.5 && startchoice){
        timings=false;
        var qnaAnswer = qnaMakerResult.answers[0].answer;
        
                var qnaAnswerData = qnaAnswer.split('~');
                var title = qnaAnswerData[0];
                var b1=qnaAnswerData[1];
                var b2=qnaAnswerData[2];
                var msg1b1="I am interested in Geography";
               // var msg2b2="I am interested in History";
                var msg = new builder.Message(session)
                msg.attachments([
                    new builder.HeroCard(session)
                    .subtitle(title)
                    .buttons([
                        builder.CardAction.imBack(session, msg1b1, "Geography"),
                       // builder.CardAction.imBack(session, msg2b2, "History"),
                    ])
                ]);
        }


//------------------------------------------------------------------------------------------------------------------------------------------


//---------------------------------------For inclusion of "$" as a special character--------------------------------------------------------
 
else if(qnaMakerResult.answers && qnaMakerResult.score >= 0.5 && history){
    timings=false;
    var qnaAnswer = qnaMakerResult.answers[0].answer;
        
    var qnaAnswerData = qnaAnswer.split('$');
    var title = qnaAnswerData[0];
    var description = qnaAnswerData[1];
    var url = qnaAnswerData[2];
    var imageURL = qnaAnswerData[3];
    var title2 = qnaAnswerData[4];
    var description2 = qnaAnswerData[5];
    var url2 = qnaAnswerData[6];
    var imageURL2 = qnaAnswerData[7];
    var b3=qnaAnswerData[9];
    var title3= qnaAnswerData[8];

    var msg = new builder.Message(session)
    msg.attachments([
        new builder.HeroCard(session)
        .title(title)
        .subtitle(description)
        .images([builder.CardImage.create(session, imageURL)])
        /*.buttons([
            builder.CardAction.openUrl(session, url, "Learn More")
        ]),
        new builder.HeroCard(session)
        .title(title2)
        .subtitle(description2)
        .images([builder.CardImage.create(session, imageURL2)])
        .buttons([
            builder.CardAction.openUrl(session, url2, "Learn More")
        ])*/,
        new builder.HeroCard(session)
        .title(title3)
        .buttons([
            builder.CardAction.imBack(session, 'I am done!', b3)
        ])
    ]);
    }


//------------------------------------------------------------------------------------------------------------------------------------------

//---------------------------------------For inclusion of "*" as a special character--------------------------------------------------------
 
else if(qnaMakerResult.answers && qnaMakerResult.score >= 0.5 && video){
    
    var qnaAnswer = qnaMakerResult.answers[0].answer;
        
    var qnaAnswerData = qnaAnswer.split('*');
    var title = qnaAnswerData[1];
    var description = qnaAnswerData[0];
    var url = qnaAnswerData[3];
    var imageURL = qnaAnswerData[2];

    var title2 = qnaAnswerData[4];
    var url2 = qnaAnswerData[6];
    var imageURL2 = qnaAnswerData[5];

    var b3=qnaAnswerData[8];
    var title3= qnaAnswerData[7];

    var msg = new builder.Message(session)
    msg.attachments([
        new builder.HeroCard(session)
        .subtitle(description),
        new builder.HeroCard(session)
        .title(title)
        .images([builder.CardImage.create(session, imageURL)])
        .buttons([
            builder.CardAction.openUrl(session, url, "Watch")
        ]),
        new builder.HeroCard(session)
        .title(title2)
        .images([builder.CardImage.create(session, imageURL2)])
        .buttons([
            builder.CardAction.openUrl(session, url2, "Watch")
        ]),
        new builder.HeroCard(session)
        .title(title3)
        .buttons([
            builder.CardAction.imBack(session, 'What\'s next?', b3)
        ])
    ]);
    timings=true;
    count+=1;
    }

//-----------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------For inclusion of "^" as a special character--------------------------------------------------------
 
else if(qnaMakerResult.answers && qnaMakerResult.score >= 0.5 && goodbad){
    timings=false;
    var qnaAnswer = qnaMakerResult.answers[0].answer;
    
            var qnaAnswerData = qnaAnswer.split('^');
            var title = qnaAnswerData[0];
            var b1=qnaAnswerData[1];
            var msg = new builder.Message(session)
            msg.attachments([
                new builder.HeroCard(session)
                .subtitle(title)
                .buttons([
                    builder.CardAction.imBack(session, "Show me the word-of-the-day" ,b1 )
                ])
            ]);
    }


//------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------For inclusion of "#" as a special character--------------------------------------------------------
 
else if(qnaMakerResult.answers && qnaMakerResult.score >= 0.5 && wod){
    timings=false;    
    var qnaAnswer = qnaMakerResult.answers[0].answer;

           request("http://urban-word-of-the-day.herokuapp.com/today" , function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                var wordi = body.word; 
            var qnaAnswerData = qnaAnswer.split('#');
            var title = wordi;
            var des=qnaAnswerData[0];
            var msg = new builder.Message(session) 
            msg.attachments([
                new builder.HeroCard(session)
                .subtitle(des),
                new builder.HeroCard(session)
                .title(title)
            ]);
            session.send(msg).endDialog();

            setTimeout(function(){
                var msg="You wanna know some latest breaking news of today?";
                session.send(msg).endDialog();
                var msg = new builder.Message(session) 
                msg.attachments([
                    new builder.HeroCard(session)
                    .buttons([
                        builder.CardAction.imBack(session, "What's the the latest news", "I'd love seeing the news")
                    ])
                ]);
                session.send(msg).endDialog();
            },2000
        );
        }
    });
}
//------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------For inclusion of "{" as a special character and API endpoint calling for news----------------------
 
else if(qnaMakerResult.answers && qnaMakerResult.score >= 0.5 && news){
    timings=false;
    var qnaAnswer = qnaMakerResult.answers[0].answer;

           request("https://newsapi.org/v2/top-headlines?sources=bbc-news&apiKey=b62795c8841d4e06bd96290ab866a986" , function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                var qnaAnswerData = qnaAnswer.split('{');
                var des=qnaAnswerData[0];
                var msg = new builder.Message(session)
                
                msg.attachments([
                    new builder.HeroCard(session)
                    .subtitle(des)
                ]);
                session.send(msg).endDialog();

                for (var i = 0; i < (body.articles).length; ++i)
                {
                    if (body.articles[i].title)
                    {
                        var msg = new builder.Message(session) 
                        msg.attachments([
                        new builder.HeroCard(session)
                        .title(body.articles[i].title)
                        .subtitle(body.articles[i].description)
                        .images([builder.CardImage.create(session, body.articles[i].urlToImage)])
                        .buttons([
                            builder.CardAction.openUrl(session, body.articles[i].url , "Read the complete story")
                        ])
                    ]);
                    session.send(msg).endDialog();
                    }
                }
                setTimeout(function(){
                    var msg = new builder.Message(session) 
                    msg.attachments([
                    new builder.HeroCard(session)
                    .buttons([
                        builder.CardAction.imBack(session, "I've read these articles" , "Click me when you are done reading!")
                    ])
                ]);
                session.send(msg).endDialog();
                },30000
            );
        }
    });
}
//------------------------------------------------------------------------------------------------------------------------------------------

session.send(msg).endDialog();
//Watson Tone Analyzer
analyzeTone(session.message);
//send sentiment score using sentiment API
sendGetSentimentRequest(question).then(function (parsedBody) {
            console.log(parsedBody);
            var sentimentScore = parsedBody.documents[0].score.toString();
            //session.send(sentimentScore).endDialog;
            var date = new Date();
            var shortDate = date.toString().slice(4,15);
            var sentimentUpload = {
                PartitionKey: {'_': name.toString(), '$':'Edm.String'},
                RowKey: {'_': shortDate.toString(), '$':'Edm.String'},
                SentimentScore: {'_':sentimentScore, '$':'Edm.String'},
            };
            tableSvc.insertOrMergeEntity('ScoreTable',sentimentUpload, function (error, result, response){});
        })
        .catch(function (err) {
            console.log("POST FAILED: " + err);
        });
        
if(timings && count==1){
    basicQnAMakerDialog=false;
    setTimeout(function(){
        var msg="You there?";
        session.send(msg).endDialog();
        var msg="I am back";
        session.send(msg).endDialog();


        setTimeout(function(){
            var msg="I have some small activity but before we can start that do you remember the word-of-the-day?";
            session.send(msg).endDialog();
// setting up luis
const LuisModelUrl = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/911d1e5e-086b-4341-9cc6-9827bc186a12?subscription-key=7aeea59a16a5467aacff93989cd145f5&verbose=true&timezoneOffset=0&q=";
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

bot.dialog('/', intents,true);

//setting up conversation
intents.matches('GetWOD', function (session, args) {
    // Dealing with entities passed from luis
  var WOD = builder.EntityRecognizer.findEntity(args.entities, 'WOD');
    if (WOD) {
        WOD = WOD.entity;

        request("http://urban-word-of-the-day.herokuapp.com/today" , function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                var wordi = body.word; 
        if(WOD==wordi){
            var msg="That's Correct! :) :)";
            session.send(msg).endDialog;
        }
        else{
            var msg="Nevermind! It was "+wordi+" instead.";
            session.send(msg).endDialog;
        }
        var msg="Okay I'll ask a few questions from the passage you read earlier. Just for fun.";
        session.send(msg).endDialog;
        var msg="Earth is a ______?";
        session.send(msg).endDialog;
        const LuisModelUrl = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/911d1e5e-086b-4341-9cc6-9827bc186a12?subscription-key=7aeea59a16a5467aacff93989cd145f5&verbose=true&timezoneOffset=0&q=";
        var recognizer = new builder.LuisRecognizer(LuisModelUrl);
        var intents = new builder.IntentDialog({ recognizers: [recognizer] });
       bot.dialog('/', intents, true);

//setting up conversation

intents.matches('GetWOD', function (session, args) {
    // Dealing with entities passed from luis
    var WOD = builder.EntityRecognizer.findEntity(args.entities, 'WOD');
    if (WOD) {
        WOD = WOD.entity;
        if(WOD=="planet"){
            session.send("That's Correct! :) :)").endDialog;
        }
        else{
            session.send("It was planet").endDialog;
        }
    }
//------
    var msg="How many named oceans are there today?";
    session.send(msg).endDialog;
    const LuisModelUrl = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/911d1e5e-086b-4341-9cc6-9827bc186a12?subscription-key=7aeea59a16a5467aacff93989cd145f5&verbose=true&timezoneOffset=0&q=";
    var recognizer = new builder.LuisRecognizer(LuisModelUrl);
    var intents = new builder.IntentDialog({ recognizers: [recognizer] });
   bot.dialog('/', intents, true);

//setting up conversation

intents.matches('GetWOD', function (session, args) {
// Dealing with entities passed from luis
var WOD = builder.EntityRecognizer.findEntity(args.entities, 'WOD');
if (WOD) {
    WOD = WOD.entity;
    if(WOD=="five"|| WOD=="5"){
        session.send("That's Correct! :) :)").endDialog;
    }
    else{
        session.send("Five was the correct answer").endDialog;
    }
}
var msg="Large areas of salty water are caled_____?";
    session.send(msg).endDialog;
    const LuisModelUrl = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/911d1e5e-086b-4341-9cc6-9827bc186a12?subscription-key=7aeea59a16a5467aacff93989cd145f5&verbose=true&timezoneOffset=0&q=";
    var recognizer = new builder.LuisRecognizer(LuisModelUrl);
    var intents = new builder.IntentDialog({ recognizers: [recognizer] });
  bot.dialog('/', intents, true);

//setting up conversation

intents.matches('GetWOD', function (session, args) {
// Dealing with entities passed from luis
var WOD = builder.EntityRecognizer.findEntity(args.entities, 'WOD');
if (WOD) {
    WOD = WOD.entity;
    if(WOD=="ocean"){
        session.send("That's Correct! :) :)").endDialog;
    }
    else{
        session.send("It was ocean").endDialog;
    }
}


var msg="Another word for continent is_____?";
    session.send(msg).endDialog;
    const LuisModelUrl = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/911d1e5e-086b-4341-9cc6-9827bc186a12?subscription-key=7aeea59a16a5467aacff93989cd145f5&verbose=true&timezoneOffset=0&q=";
    var recognizer = new builder.LuisRecognizer(LuisModelUrl);
    var intents = new builder.IntentDialog({ recognizers: [recognizer] });
  bot.dialog('/', intents, true);

//setting up conversation

intents.matches('GetWOD', function (session, args) {
// Dealing with entities passed from luis
var WOD = builder.EntityRecognizer.findEntity(args.entities, 'WOD');
if (WOD) {
    WOD = WOD.entity;
    if(WOD=="landmass"){
        session.send("That's Correct! :) :)").endDialog;
    }
    else{
        session.send("It was landmass").endDialog;
    }
}

/*var d = new Date();
    var dh = d.getHours();
if (dh > 6) {
    dh = dh - 12;
    }
    else
var di = dh*3600000;
    */
   /* setTimeout(function () {
        //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%



   

            
         //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    },5000
    ); */
    
    



//----
})
.matches('None', function (session) {
    session.endDialog("I don't understand. Please try again.");

});
//----
});
});
});

    }
});

    }
});

        },7000
    );

    },60000
);
}
}
function sendGetSentimentRequest(message) {
    var options = {
        method: 'POST',
        uri: requestUrl,
        body: {
            documents:[{id:'1', language: 'en', text:message}]
        },
        json: true, // Automatically stringifies the body to JSON,
        headers: header
    };
    return rp(options);
}
const confidencethreshold = 0.55;

function analyzeTone(ev) {
  let text = ev.text;
  tone_analyzer.tone({text: text}, function(error, response) {
    if (error) {
      console.log(error);
    } else
    {
    console.log(JSON.stringify(response, null, 2));
    response.document_tone.tones.forEach((tone_id) => {
            if(tone_id.score >= confidencethreshold) { // pulse only if the likelihood of an emotion is above the given confidencethreshold
              console.log(tone_id.score);
              var date = new Date();
              var shortDate = date.toString().slice(4,15);
              if(tone_id.tone_name=="Anger"){
              	var toneUpload = {
              		PartitionKey: {'_': name.toString(), '$':'Edm.String'},
              		RowKey: {'_': shortDate.toString(), '$':'Edm.String'},
              		Anger: {'_':tone_id.score.toString(), '$':'Edm.String'},
              	};
              	tableSvc.insertOrMergeEntity ('ScoreTable',toneUpload, function (error, result, response){});
              }
              else if (tone_id.tone_name=="Fear"){
              	var toneUpload = {
              		PartitionKey: {'_': name.toString(), '$':'Edm.String'},
              		RowKey: {'_': shortDate.toString(), '$':'Edm.String'},
              		Fear: {'_':tone_id.score.toString(), '$':'Edm.String'},
              	};
              	tableSvc.insertOrMergeEntity ('ScoreTable',toneUpload, function (error, result, response){});
              }
              else if (tone_id.tone_name=="Joy"){
              	var toneUpload = {
              		PartitionKey: {'_': name.toString(), '$':'Edm.String'},
              		RowKey: {'_': shortDate.toString(), '$':'Edm.String'},
              		Joy: {'_':tone_id.score.toString(), '$':'Edm.String'},
              	};
              	tableSvc.insertOrMergeEntity ('ScoreTable',toneUpload, function (error, result, response){});
              }
              else if (tone_id.tone_name=="Sadness"){
              	var toneUpload = {
              		PartitionKey: {'_': name.toString(), '$':'Edm.String'},
              		RowKey: {'_': shortDate.toString(), '$':'Edm.String'},
              		Sadness: {'_':tone_id.score.toString(), '$':'Edm.String'},
              	};
              	tableSvc.insertOrMergeEntity ('ScoreTable',toneUpload, function (error, result, response){});
              }
              else if (tone_id.tone_name=="Analytical"){
              	var toneUpload = {
              		PartitionKey: {'_': name.toString(), '$':'Edm.String'},
              		RowKey: {'_': shortDate.toString(), '$':'Edm.String'},
              		Analytical: {'_':tone_id.score.toString(), '$':'Edm.String'},
              	};
              	tableSvc.insertOrMergeEntity ('ScoreTable',toneUpload, function (error, result, response){});
              }
              else if (tone_id.tone_name=="Confident"){
              	var toneUpload = {
              		PartitionKey: {'_': name.toString(), '$':'Edm.String'},
              		RowKey: {'_': shortDate.toString(), '$':'Edm.String'},
              		Confident: {'_':tone_id.score.toString(), '$':'Edm.String'},
              	};
              	tableSvc.insertOrMergeEntity ('ScoreTable',toneUpload, function (error, result, response){});
              }
              else if (tone_id.tone_name=="Tentative"){
              	var toneUpload = {
              		PartitionKey: {'_': name.toString(), '$':'Edm.String'},
              		RowKey: {'_': shortDate.toString(), '$':'Edm.String'},
              		Tentative: {'_':tone_id.score.toString(), '$':'Edm.String'},
              	};
              	tableSvc.insertOrMergeEntity ('ScoreTable',toneUpload, function (error, result, response){});
              }

          }
          })
	}
  });
}
