'use strict';
const app = require('../../index');
const request = require('supertest');
const should = require('should');
const Account = require('./../../models/account');

describe('ENDPOINT /accounts', () => {
    var NATO = [
        'alpha',
        'bravo',
        'charlie',
        'delta',
        'echo',
        'foxtrot',
        'golf',
        'hotel',
        'india',
        'juliet',
        'kilo',
        'lima',
        'mike',
        'november',
        'oscar',
        'papa',
        'quebec',
        'romeo',
        'sierra',
        'tango',
        'uniform',
        'victor',
        'whiskey',
        'xray',
        'yankee',
        'zulu'
    ];

    var userAlphaAuthenticationToken;
    var userBetaAuthenticationToken;

    var accountAlpha;
    var accountBeta;

    var alphaData = {
        email: NATO[0] + '@' + NATO[0] + '.' + NATO[0],
        password: NATO[0]
    };
    var betaData = {
        email: NATO[1] + '@' + NATO[1] + '.' + NATO[1],
        password: NATO[1]
    };
    beforeEach('Deletes all accounts', (done)=> {
        Account.remove((err)=> {
            if (err) return done(err);
            done();
        });
    });


    beforeEach('Polulates 2 account in Account collection', (done)=> {
        var data = [];
        for (var i = 0; i < 2; i++) {
            data.push({
                email: NATO[i] + '@' + NATO[i] + '.' + NATO[i],
                password: NATO[i]
            });
        }
        Account
            .create(data)
            .then((data)=> {
                accountAlpha = data[0];
                accountBeta = data[1];
                done();
            })
            .catch((err)=> {
                return done(err);
            });

    });


    beforeEach('Upgrades alpha account role', (done)=> {
        Account
            .findOne()
            .where('_id').equals(accountAlpha._id)
            .then((data)=> {
                data.role = 'ADMIN';
                data
                    .save()
                    .then((data) => {
                        // console.log(data);
                        accountAlpha = data
                        done();
                    })
                    .catch((err)=> {
                        return done(err);
                    })
            })
            .catch((err)=> {
                return done(err);
            });
    });

    beforeEach('Obtains alpha authentication token', (done)=> {
        request(app)
            .post('/tokens/obtain')
            .send(alphaData)
            .end((err, res)=> {
                if (err) return done(err);
                userAlphaAuthenticationToken = 'Bearer ' + res.body.token;
                done();
            });
    });

    beforeEach('Obtains beta authentication token', (done)=> {
        request(app)
            .post('/tokens/obtain')
            .send(betaData)
            .end((err, res)=> {
                if (err) return done(err);
                userBetaAuthenticationToken = 'Bearer ' + res.body.token;
                done();
            });
    });
    describe('when GET request', ()=> {
        describe('when account not authenticated', ()=> {
            it('should return HTTP 401 Unauthorized', (done) => {
                request(app)
                    .get('/accounts')
                    .expect(401)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
        });
        describe('when authenticated', ()=> {
            describe('when not authorized', ()=> {
                it('should return HTTP 403 Forbidden', (done) => {
                    request(app)
                        .get('/accounts')
                        .set('Authorization', userBetaAuthenticationToken)
                        .expect(403)
                        .end((err)=> {
                            if (err) return done(err);
                            done();
                        });
                });
            });
            describe('when authorized', ()=> {
                it('should return HTTP 200 OK', (done) => {
                    request(app)
                        .get('/accounts')
                        .set('Authorization', userAlphaAuthenticationToken)
                        .expect(200)
                        .end((err)=> {
                            if (err) return done(err);
                            done();
                        });
                });
                it('should return JSON content', (done) => {
                    request(app)
                        .get('/accounts')
                        .set('Authorization', userAlphaAuthenticationToken)
                        .expect('Content-Type', /json/)
                        .end((err)=> {
                            if (err) return done(err);
                            done();
                        });
                });
                describe('when obtain JSON content', ()=> {

                    it('should return Object', (done) => {
                        request(app)
                            .get('/accounts')
                            .set('Authorization', userAlphaAuthenticationToken)
                            .end((err, res)=> {
                                if (err) return done(err);
                                res.body.should.be.instanceOf(Object);
                                done();
                            });
                    });
                    it('should have accounts field', (done) => {
                        request(app)
                            .get('/accounts')
                            .set('Authorization', userAlphaAuthenticationToken)
                            .end((err, res)=> {
                                if (err) return done(err);
                                res.body.should.have.property('accounts');
                                done();
                            });
                    });
                    it('should have limit field', (done) => {
                        request(app)
                            .get('/accounts')
                            .set('Authorization', userAlphaAuthenticationToken)
                            .end((err, res)=> {
                                if (err) return done(err);
                                res.body.should.have.property('limit');
                                done();
                            });
                    });

                    it('should have skip field', (done) => {
                        request(app)
                            .get('/accounts')
                            .set('Authorization', userAlphaAuthenticationToken)
                            .end((err, res)=> {
                                if (err) return done(err);
                                res.body.should.have.property('skip');
                                done();
                            });
                    });

                    describe('when using pagination options in query', ()=> {
                        beforeEach('Adds accounts to Account collection', (done)=> {
                            var data = [];
                            for (var i = 2; i < NATO.length; i++) {
                                data.push({
                                    email: NATO[i] + '@' + NATO[i] + '.' + NATO[i],
                                    password: NATO[i]
                                });
                            }

                            Account
                                .create(data)
                                .then((data)=> {
                                    done();
                                })
                                .catch((err)=> {
                                    return done(err);
                                });

                        });
                        it('accounts length should equal 20 ', (done) => {
                            request(app)
                                .get('/accounts')
                                .set('Authorization', userAlphaAuthenticationToken)
                                .end((err, res)=> {
                                    if (err) return done(err);
                                    res.body.accounts.length.should.equal(20);
                                    done();
                                });
                        });

                        it('10 elements should be skipped', (done) => {
                            request(app)
                                .get('/accounts?skip=10')
                                .set('Authorization', userAlphaAuthenticationToken)
                                .end((err, res)=> {
                                    if (err) return done(err);
                                    Account
                                        .count()
                                        .then((data)=> {
                                            res.body.accounts.length.should.equal(data - 10);
                                            done();
                                        }).catch((err)=> {
                                        if (err) return done(err);
                                    });
                                });
                        });
                    });
                });
            });

        });
    });
    describe('when GET /accounts/count request', ()=> {


        describe('when account not authenticated', ()=> {
            it('should return HTTP 401 Unauthorized', (done) => {
                request(app)
                    .get('/accounts/count')
                    .expect(401)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
        });
        describe('when authenticated', ()=> {
            describe('when not authorized', ()=> {
                it('should return HTTP 403 Forbidden', (done) => {
                    request(app)
                        .get('/accounts/count')
                        .set('Authorization', userBetaAuthenticationToken)
                        .expect(403)
                        .end((err)=> {
                            if (err) return done(err);
                            done();
                        });
                });
            });
            describe('when authorized', ()=> {
                it('should return HTTP 200 OK', (done) => {
                    request(app)
                        .get('/accounts/count')
                        .set('Authorization', userAlphaAuthenticationToken)
                        .expect(200)
                        .end((err)=> {
                            if (err) return done(err);
                            done();
                        });
                });
                it('should return JSON content', (done) => {
                    request(app)
                        .get('/accounts/count')
                        .set('Authorization', userAlphaAuthenticationToken)
                        .expect('Content-Type', /json/)
                        .end((err)=> {
                            if (err) return done(err);
                            done();
                        });
                });
                it('should return Object', (done) => {
                    request(app)
                        .get('/accounts/count')
                        .set('Authorization', userAlphaAuthenticationToken)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.should.be.instanceOf(Object);
                            done();
                        });
                });
                describe('when return Object', ()=> {
                    it('should contain accounts field', (done) => {
                        request(app)
                            .get('/accounts/count')
                            .set('Authorization', userAlphaAuthenticationToken)
                            .end((err, res)=> {
                                if (err) return done(err);
                                res.body.should.have.property('accounts');
                                done();
                            });
                    });
                    it('accounts field should be a Number', (done) => {
                        request(app)
                            .get('/accounts/count')
                            .set('Authorization', userAlphaAuthenticationToken)
                            .end((err, res)=> {
                                if (err) return done(err);
                                res.body.accounts.should.be.instanceof(Number);
                                done();
                            });
                    });
                    it('accounts field should equal to number of elements in Account collection', (done) => {
                        request(app)
                            .get('/accounts/count')
                            .set('Authorization', userAlphaAuthenticationToken)
                            .end((err, res)=> {
                                if (err) return done(err);
                                Account
                                    .count()
                                    .then((data)=> {
                                        res.body.accounts.should.equal(data);
                                        done();
                                    }).catch((err)=> {
                                    if (err) return done(err);
                                });
                            });
                    });
                });
            });
        });
    });


    /**
     * @todo Zrobić testy jeśli nie ma jednego z pól
     */
    describe('when POST /accounts request', ()=> {
        describe('when not authenticated', ()=> {
            var data = {
                email: 'test@test.test',
                password: 'test'
            };

            it('should return HTTP 400 Bad Request - wrong email format', (done)=> {
                request(app)
                    .post('/accounts')
                    .send({
                        email: 'sdfsd',
                        password: 's'
                    })
                    .expect(400)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });

            it('should return HTTP 400 Bad Request - duplicate email', (done)=> {
                request(app)
                    .post('/accounts')
                    .send({
                        email: 'alpha@alpha.alpha',
                        password: 's'
                    })
                    .expect(400)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            it('should return HTTP 400 Bad Request - missing password', (done)=> {
                request(app)
                    .post('/accounts')
                    .send({
                        email: 'sdfsd'
                    })
                    .expect(400)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            it('should return HTTP 400 Bad Request - missing email', (done)=> {
                request(app)
                    .post('/accounts')
                    .send({
                        password: 'sdfsd'
                    })
                    .expect(400)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });

            it('should return HTTP 201 Created', (done)=> {
                request(app)
                    .post('/accounts')
                    .send(data)
                    .expect(201)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            it('should return JSON content', (done) => {
                request(app)
                    .post('/accounts')
                    .send(data)
                    .expect('Content-Type', /json/)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });

            //piękny description ^^
            describe('when there is content', ()=> {

                it('should return object', (done)=> {
                    request(app)
                        .post('/accounts')
                        .send(data)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.should.be.instanceOf(Object);
                            done();
                        });
                });
                it('should return object with field _id', (done)=> {
                    request(app)
                        .post('/accounts')
                        .send(data)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.should.have.property('_id');
                            done();
                        });
                });
                it('should return object with field email', (done)=> {
                    request(app)
                        .post('/accounts')
                        .send(data)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.should.have.property('email');
                            done();
                        });
                });
                it('field email should equal', (done)=> {
                    request(app)
                        .post('/accounts')
                        .send(data)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.email.should.equal(data.email);
                            done();
                        });
                });
                it('should return object with field createdAt', (done)=> {
                    request(app)
                        .post('/accounts')
                        .send(data)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.should.have.property('createdAt');
                            done();
                        });
                });
                it('should return object with field updatedAt', (done)=> {
                    request(app)
                        .post('/accounts')
                        .send(data)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.should.have.property('updatedAt');
                            done();
                        });
                });
            });
        });

        describe('when authenticated', ()=> {
            var data = {
                email: 'test@test.test',
                password: 'test'
            };
            it('should return HTTP 201 Created', (done)=> {
                request(app)
                    .post('/accounts')
                    .set('Authorization', userAlphaAuthenticationToken)

                    .send(data)
                    .expect(201)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            it('should return JSON content', (done) => {
                request(app)
                    .post('/accounts')
                    .set('Authorization', userAlphaAuthenticationToken)
                    .send(data)
                    .expect('Content-Type', /json/)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            //piękny description ^^
            describe('when there is content', ()=> {
                it('should return object', (done)=> {
                    request(app)
                        .post('/accounts')
                        .set('Authorization', userAlphaAuthenticationToken)
                        .send()
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.should.be.instanceOf(Object);
                            done();
                        });
                });
                it('should return object with field _id', (done)=> {
                    request(app)
                        .post('/accounts')
                        .set('Authorization', userAlphaAuthenticationToken)
                        .send(data)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.should.have.property('_id');
                            done();
                        });
                });
                it('should return object with field email', (done)=> {
                    request(app)
                        .post('/accounts')
                        .set('Authorization', userAlphaAuthenticationToken)
                        .send(data)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.should.have.property('email');
                            done();
                        });
                });
                it('field email should equal', (done)=> {
                    request(app)
                        .post('/accounts')
                        .set('Authorization', userAlphaAuthenticationToken)
                        .send(data)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.email.should.equal(data.email);
                            done();
                        });
                });
                it('should return object with field updatedAt', (done)=> {
                    request(app)
                        .post('/accounts')
                        .set('Authorization', userAlphaAuthenticationToken)
                        .send(data)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.should.have.property('updatedAt');
                            done();
                        });
                });
            });
        });
    });
    describe('when GET  /accounts/:id request', ()=> {
        describe('when not authenticated', () => {
            var data = {
                email: 'test@test.test',
                password: 'test'
            };
            var account;

            it('should return HTTP 401 Unauthorized when invalid id', (done)=> {
                request(app)
                    .get('/accounts/' + 23452345)
                    .expect(401)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            it('should return HTTP 401 Unauthorized when valid id', (done)=> {
                request(app)
                    .get('/accounts/' + accountAlpha._id)
                    .expect(401)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
        });
        describe('when authenticated', ()=> {
            describe('when accesing userBeta with userAlphaToken', function () {
                it('should return HTTP 200 OK  ', (done)=> {
                    request(app)
                        .get('/accounts/' + accountBeta._id)
                        .set('Authorization', userAlphaAuthenticationToken)
                        .expect(200)
                        .end((err)=> {
                            if (err) return done(err);
                            done();
                        });
                });
            });
            describe('when accesing userAlpha with userBetaToken', ()=> {
                it('should return HTTP 403 Forbidden', (done)=> {
                    request(app)
                        .get('/accounts/' + accountAlpha._id)
                        .set('Authorization', userBetaAuthenticationToken)
                        .expect(403)
                        .end((err)=> {
                            if (err) return done(err);
                            done();
                        });
                });
            });

            it('should return HTTP 404 Not Found', (done)=> {
                request(app)
                    .get('/accounts/' + 23452345)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .expect(404)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            it('should return HTTP 200 OK', (done)=> {
                request(app)
                    .get('/accounts/' + accountAlpha._id)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .expect(200)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            it('should return JSON content', (done) => {
                request(app)
                    .get('/accounts/' + accountAlpha._id)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .expect('Content-Type', /json/)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            //piękny description ^^
            describe('when there is content', ()=> {
                it('should return object', (done)=> {
                    request(app)
                        .get('/accounts/' + accountAlpha._id)
                        .set('Authorization', userAlphaAuthenticationToken)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.should.be.instanceOf(Object);
                            done();
                        });
                });

                it('should return object with field _id', (done)=> {
                    request(app)
                        .get('/accounts/' + accountAlpha._id)
                        .set('Authorization', userAlphaAuthenticationToken)
                        .end((err, res)=> {
                            if (err) return done(err);
                            res.body.should.have.property('_id');
                            done();
                        });
                });
                it('field _id should equal', (done)=> {
                    request(app)
                        .get('/accounts/' + accountAlpha._id)
                        .set('Authorization', userAlphaAuthenticationToken)
                        .end((err, res)=> {
                            if (err) {
                                return done(err);
                            }
                            /**
                             * @WARNING test it  - _id is objectid so it was needed to cast it to string
                             */
                            res.body._id.should.equal(accountAlpha._id.toString());
                            done();
                        });
                });
                it('should return object with field email', (done)=> {
                    request(app)
                        .get('/accounts/' + accountAlpha._id)
                        .set('Authorization', userAlphaAuthenticationToken)
                        .end((err, res)=> {
                            if (err) {
                                return done(err);
                            }
                            res.body.should.have.property('email');
                            done();
                        });
                });
                it('field email should equal', (done)=> {
                    request(app)
                        .get('/accounts/' + accountAlpha._id)
                        .set('Authorization', userAlphaAuthenticationToken)

                        .end((err, res)=> {
                            if (err)
                                return done(err);
                            res.body.email.should.equal(accountAlpha.email);
                            done();
                        });
                });
                it('should return object with field createdAt', (done)=> {
                    request(app)
                        .get('/accounts/' + accountAlpha._id)
                        .set('Authorization', userAlphaAuthenticationToken)
                        .end((err, res)=> {
                            if (err)
                                return done(err);
                            res.body.should.have.property('createdAt');
                            done();
                        });
                });
                it('should return object with field updatedAt', (done)=> {
                    request(app)
                        .get('/accounts/' + accountAlpha._id)
                        .set('Authorization', userAlphaAuthenticationToken)
                        .end((err, res)=> {
                            if (err)
                                return done(err);
                            res.body.should.have.property('updatedAt');
                            done();
                        });
                });
            });
        });
    });
    describe('when PUT /accounts/:id', ()=> {
        var data = {
            _id: 234234,
            email: 's',
            password: 'd'
        };
        var dataAccount = {
            email: 'test@test.test',
            password: 'testA'
        };
        var account;
        beforeEach('Creates account', (done)=> {
            request(app)
                .post('/accounts')
                .send(dataAccount)
                .end((err, res)=> {
                    if (err) return done(err);
                    account = res.body;
                    done();
                });
        });
        describe('when not authenticated', ()=> {
            it('should return HTTP 401 Unauthorized when invalid id', (done)=> {
                request(app)
                    .put('/accounts/' + 23452345)
                    .send(data)
                    .expect(401)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            it('should return HTTP 401 Unauthorized when valid id', (done)=> {
                request(app)
                    .put('/accounts/' + account._id)
                    .send(data)
                    .expect(401)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
        });
        describe('when authenticated', ()=> {

            it('should return HTTP 404 Not Found', (done)=> {
                request(app)
                    .put('/accounts/' + 23452345)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .send(data)
                    .expect(404)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            it('should return HTTP 200 OK', (done)=> {
                request(app)
                    .put('/accounts/' + accountAlpha._id)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .send(data)
                    .expect(200)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            it('should return JSON content', (done) => {
                request(app)
                    .put('/accounts/' + account._id)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .send(data)
                    .expect('Content-Type', /json/)
                    .end((err)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            it('should not change _id field', (done) => {
                request(app)
                    .put('/accounts/' + account._id)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .send(data)
                    .end((err, res)=> {
                        if (err) return done(err);
                        res.body._id.should.be.equal(account._id);
                        done();
                    });
            });
            it('should not change email field', (done) => {
                request(app)
                    .put('/accounts/' + account._id)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .send(data)
                    .end((err, res)=> {
                        if (err) return done(err);
                        res.body.email.should.be.equal(account.email);
                        done();
                    });
            });
            it('should change password field', (done) => {
                request(app)
                    .put('/accounts/' + account._id)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .send(data)
                    .end((err, res)=> {
                        if (err) return done(err);
                        Account.findOne({_id: account._id}).select('password').exec((err, acc)=> {
                            if (err) return done(err);
                            acc.password.should.be.equal(res.body.password);

                        })
                        done();
                    });
            });
            it('should return object with field createdAt', (done)=> {
                request(app)
                    .put('/accounts/' + account._id)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .send(data)
                    .end((err, res)=> {
                        if (err)
                            return done(err);
                        res.body.should.have.property('createdAt');
                        done();
                    });
            });
            it('should return object with field updatedAt', (done)=> {
                request(app)
                    .put('/accounts/' + account._id)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .send(data)
                    .end((err, res)=> {
                        if (err)
                            return done(err);
                        res.body.should.have.property('updatedAt');
                        done();
                    });
            });
        });
    });
    describe('when DELETE /accounts/:id', ()=> {
        var account;

        describe('when not authenticated', ()=> {
            it('should return HTTP 401 Unauthorized when invalid id', (done)=> {
                request(app)
                    .delete('/accounts/' + 12323)
                    .expect(401)
                    .end((err, res)=> {
                        if (err) return done(err);
                        done();
                    });
            });
            it('should return HTTP 401 Unauthorized when valid id', (done)=> {
                request(app)
                    .delete('/accounts/' + accountAlpha._id)
                    .expect(401)
                    .end((err, res)=> {
                        if (err) return done(err);
                        done();
                    });
            });
        });

        describe('when authenticated', ()=> {

            it('should return HTTP 404 Not Found', (done)=> {
                request(app)
                    .delete('/accounts/' + 12323)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .expect(404)
                    .end((err, res)=> {
                        if (err) return done(err);
                        done();
                    });
            });

            it('should return HTTP Successful code 204', (done)=> {
                request(app)
                    .delete('/accounts/' + accountAlpha._id)
                    .set('Authorization', userAlphaAuthenticationToken)
                    .expect(204)
                    .end((err, res)=> {
                        if (err) return done(err);
                        done();
                    });
            });
        });


    });

});