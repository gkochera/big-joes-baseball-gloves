/*
Project for CS290 SP2020 - Baseball Glove Website
*/



// SETUP
var express = require('express');
var app = express();
var handlebars = require('express-handlebars');
var path = require('path')
var https = require('https')
var xml2js = require('xml2js').parseString;
var objectToXML = require('object-to-xml')
var stripHtml = require('string-strip-html')

app.engine('handlebars', handlebars())
app.set('view engine', 'handlebars')
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())
app.use(express.urlencoded({extended: true}))



// EBAY SETTINGS
app.set('user_token', '')
const ebayHostname = 'api.ebay.com'
const ebayPort = 443
const ebayPath = '/ws/api.dll'
const ebayAPICompatibilityLevel = 1149
const ebayAPISiteID = 0
const ebayAPIAuthGrantCode = process.env.ebayAPIAuthGrantCode
const ebayAPIRefreshToken = process.env.ebayAPIRefreshToken
const ebayAPIDevName = process.env.ebayAPIDevName
const ebayAPICertName = process.env.ebayAPICertName
const ebayAPIAppName = process.env.ebayAPIAppName
const ebayRuName = process.env.ebayRuName
const ebayClientScopes = process.env.ebayClientScopes

// MIDDLEWARE
var getEbayListings = function (req, res, next){
    var responseBody = ''
    const options = {
        hostname: ebayHostname,
        port: ebayPort,
        path: ebayPath,
        method: 'POST',
        headers: {
            'X-EBAY-API-COMPATIBILITY-LEVEL': ebayAPICompatibilityLevel,
            'X-EBAY-API-CALL-NAME': 'GetSellerList',
            'X-EBAY-API-SITEID': ebayAPISiteID,
            'X-EBAY-API-IAF-TOKEN': app.get('user_token'),
            'X-EBAY-API-DEV-NAME': ebayAPIDevName,
            'X-EBAY-API-CERT-NAME': ebayAPICertName,
            'X-EBAY-API-APP-NAME': ebayAPIAppName,
            'Content-Type': 'text/xml'
        }
    }
    
    var requestBody = objectToXML({
        '?xml version=\"1.0\" encoding=\"utf-8\"?' : null,
        GetSellerListRequest : {
            '@' : {
                xmlns: 'urn:ebay:apis:eBLBaseComponents'
            },
            '#' : {
                Sort: 1,
                IncludeItemSpecifics: 'true',
                DetailLevel: 'ReturnAll',
                EndTimeFrom: '2020-05-23T18:00:00.000Z',
                EndTimeTo : '2020-06-23T18:00:00.000Z',
                Pagination: {
                    EntriesPerPage: 12,
                    PageNumber: 1,
                },
                OutputSelector: 'Title,ItemID,CurrentPrice,GalleryURL,Description,ViewItemURL'
            }
        },
    })

    const request = https.request(options, function(response){
            
            response.on('data', function(chunk) {
                responseBody += chunk;
            })
            response.on('end', function() {
                xml2js(responseBody, function (err, result) {
                    req.getEbayListings = result
                    next() 
                })
            })        
        })
    request.write(requestBody)
    request.end();   
};

var parseEbayListings = function (req, res, next){
    let data = req.getEbayListings['GetSellerListResponse']['ItemArray'][0]['Item']
    let output = {}

    for (i=0; i<data.length; i++) {
        
        longString = stripHtml(data[i].Description[0])
        shortStringLength = 30
        shortString = longString.split(" ").splice(0,shortStringLength).join(" ").concat("...")
        price = '$' + parseFloat(data[i].SellingStatus[0].CurrentPrice[0]._).toFixed(2).toString()


        output[i] = {
            ItemID: data[i].ItemID[0],
            Price: price,
            Title: data[i].Title[0],
            PictureURL: data[i].PictureDetails[0].GalleryURL[0],
            Description: longString,
            ShortDescription: shortString,
            ItemURL: data[i].ListingDetails[0].ViewItemURL[0] 
        }
    }

    req.parseEbayListings = output
    next()
}

var getEbayApplicationToken = function (req, res, next) {
    var responseBody = ''
    const options = {
        hostname: 'api.ebay.com',
        port: ebayPort,
        path: '/identity/v1/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(ebayAPIAppName + ':' + ebayAPICertName).toString('base64')
        }
    }

    var requestBody = 'grant_type=client_credentials&scope=' + encodeURIComponent('https://api.ebay.com/oauth/api_scope')

    const request = https.request(options, function(response){
        response.on('data', function(chunk) {
            responseBody += chunk;
        })
        response.on('end', function() {
            let responseObject = {}
            responseObject.access_token = ""
            responseObject = JSON.parse(responseBody)
            req.getEbayApplicationToken = responseObject.access_token
            next()
        })        
    })

request.write(requestBody)
request.end(); 

}

var getEbayUserTokenWithRefresh = function (req, res, next) {
    var responseBody = ''
    const options = {
        hostname: 'api.ebay.com',
        port: ebayPort,
        path: '/identity/v1/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(ebayAPIAppName + ':' + ebayAPICertName).toString('base64')
        }
    }

    var requestBody = 'grant_type=authorization_code&code=' + ebayAPIAuthGrantCode +
    '&redirect_uri=' + ebayRuName

    const request = https.request(options, function(response){
        response.on('data', function(chunk) {
            responseBody += chunk;
        })
        response.on('end', function() {
            req.getEbayUserTokenWithRefresh = JSON.parse(responseBody)
            next()
        })     
    })
    request.write(requestBody)
    request.end(); 
}

app.use(getEbayListings)
app.use(parseEbayListings)
app.use(getEbayApplicationToken)
app.use(getEbayUserTokenWithRefresh)

// AUTHENTICATION
// This is a terrible way to implement keeping a fresh token on the server and I almost debated on scrapping the idea,
// a better way might be using Passport or utilizing sessions...
var updateCounter = 0
function refreshEbayUserToken() {
    console.log('Refreshing user token... (' + updateCounter + ')')
    updateCounter++
    var responseBody = ''
    const options = {
        hostname: 'api.ebay.com',
        port: ebayPort,
        path: '/identity/v1/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(ebayAPIAppName + ':' + ebayAPICertName).toString('base64')
        }
    }

    var requestBody = 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(ebayAPIRefreshToken) +
    '&scopes=' + encodeURIComponent(ebayClientScopes)

    const request = https.request(options, function(response){
        response.on('data', function(chunk) {
            responseBody += chunk;
        })
        response.on('end', function() {
            var responseObject = JSON.parse(responseBody)
            var refreshedToken = responseObject.access_token
            app.set('user_token', refreshedToken)
        })     
    })
    request.write(requestBody)
    request.end(); 
}
refreshEbayUserToken()
setInterval(refreshEbayUserToken, 6120000)


// APPLICATION

app.get('/', function(req, res){
    res.render('home',{carouselOn: true})
});

app.get('/about', function(req, res){
    res.render('about')
})

app.get('/contact', function(req, res){
    res.render('contact')
})

app.get('/inventory', function(req, res){
    var inventory = req.parseEbayListings
    res.render('inventory', {inventory: inventory})
});

app.get('/data', function(req, res){
    var data = JSON.stringify(req.parseEbayListings, undefined, 2)
    res.render('scrollbox', {data: data})
})


// LISTENER

app.listen(process.env.PORT, function(){
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.')
});


// END OF FILE