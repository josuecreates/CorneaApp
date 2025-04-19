class Auth {
    constructor(dbInstance) {
        this.db = dbInstance;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.checkAuth();
    }

    login(email, senha) {
        const user = this.db.findUserByEmail(email);
        if (user && user.senha === senha) {
            this.currentUser = user;
            this.isAuthenticated = true;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'E-mail ou senha incorretos' };
    }

    register(nome, email, senha, tipo) {
        if (this.db.findUserByEmail(email)) {
            return { success: false, message: 'E-mail já cadastrado' };
        }
        
        // Define perfil baseado no tipo
        let perfil = 'paciente';
        if (tipo === 'donor') perfil = 'doador';
        if (tipo === 'family') perfil = 'familiar';
        
        const newUser = { 
            nome, 
            email, 
            senha, 
            perfil,
            tipo,
            dataCadastro: new Date().toISOString()
        };
        
        this.db.addUser(newUser);
        return { success: true, user: newUser };
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        sessionStorage.removeItem('currentUser');
    }

    checkAuth() {
        const user = sessionStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.isAuthenticated = true;
        }
        return this.isAuthenticated;
    }

    isAdmin() {
        return this.isAuthenticated && this.currentUser.perfil === 'admin';
    }

    isPatient() {
        return this.isAuthenticated && this.currentUser.perfil === 'paciente';
    }

    isDonor() {
        return this.isAuthenticated && this.currentUser.perfil === 'doador';
    }

    isFamily() {
        return this.isAuthenticated && this.currentUser.perfil === 'familiar';
    }
}

const auth = new Auth(db);