class Database {
    constructor() {
        this.loadData();
    }

    loadData() {
        this.users = JSON.parse(localStorage.getItem('users')) || [
            { 
                id: 1, 
                nome: "Admin", 
                email: "admin@hospital.com", 
                senha: "123456", 
                perfil: "admin",
                dataCadastro: new Date().toISOString()
            }
        ];
        this.pacientes = JSON.parse(localStorage.getItem('pacientes')) || [];
        this.transplantes = JSON.parse(localStorage.getItem('transplantes')) || [];
        this.doadores = JSON.parse(localStorage.getItem('doadores')) || [];
    }

    // Métodos para usuários
    addUser(user) {
        user.id = this.users.length ? Math.max(...this.users.map(u => u.id)) + 1 : 1;
        user.dataCadastro = new Date().toISOString();
        this.users.push(user);
        this.save('users');
        return user;
    }

    findUserByEmail(email) {
        return this.users.find(u => u.email === email);
    }

    // Métodos para pacientes
    addPaciente(paciente) {
        paciente.id = this.pacientes.length ? Math.max(...this.pacientes.map(p => p.id)) + 1 : 1;
        paciente.dataCadastro = new Date().toISOString();
        this.pacientes.push(paciente);
        this.save('pacientes');
        return paciente;
    }

    updatePaciente(id, updatedData) {
        const index = this.pacientes.findIndex(p => p.id === id);
        if (index !== -1) {
            this.pacientes[index] = {...this.pacientes[index], ...updatedData};
            this.save('pacientes');
            return true;
        }
        return false;
    }

    deletePaciente(id) {
        const index = this.pacientes.findIndex(p => p.id === id);
        if (index !== -1) {
            this.pacientes.splice(index, 1);
            this.save('pacientes');
            return true;
        }
        return false;
    }

    // Métodos para transplantes
    addTransplante(transplante) {
        transplante.id = this.transplantes.length ? Math.max(...this.transplantes.map(t => t.id)) + 1 : 1;
        transplante.data = new Date().toISOString();
        this.transplantes.push(transplante);
        this.save('transplantes');
        return transplante;
    }

    // Métodos para doadores
    addDoador(doador) {
        doador.id = this.doadores.length ? Math.max(...this.doadores.map(d => d.id)) + 1 : 1;
        this.doadores.push(doador);
        this.save('doadores');
        return doador;
    }

    // Métodos gerais
    save(key) {
        localStorage.setItem(key, JSON.stringify(this[key]));
        this.loadData();
    }

    getEstatisticas() {
        return {
            totalPacientes: this.pacientes.length,
            pacientesEspera: this.pacientes.filter(p => p.status === 'espera').length,
            transplantesMes: this.getTransplantesEsteMes(),
            tempoMedioEspera: this.getTempoMedioEspera(),
            doadoresDisponiveis: this.doadores.filter(d => d.status === 'disponivel').length
        };
    }

    getPacientes() {
        return this.pacientes;
    }

    getTransplantes() {
        return this.transplantes;
    }

    getPacienteById(id) {
        return this.pacientes.find(p => p.id === id);
    }

    getTransplantesEsteMes() {
        const now = new Date();
        return this.transplantes.filter(t => {
            const transplanteDate = new Date(t.data);
            return transplanteDate.getMonth() === now.getMonth() && 
                   transplanteDate.getFullYear() === now.getFullYear();
        }).length;
    }

    getTempoMedioEspera() {
        if (this.transplantes.length === 0) return 0;
        
        const tempos = this.transplantes.map(t => {
            const paciente = this.pacientes.find(p => p.id === t.pacienteId);
            if (paciente) {
                const diff = new Date(t.data) - new Date(paciente.dataCadastro);
                return diff / (1000 * 60 * 60 * 24); // Dias
            }
            return 0;
        }).filter(t => t > 0);
        
        return tempos.length ? (tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(1) : 0;
    }
}

const db = new Database();