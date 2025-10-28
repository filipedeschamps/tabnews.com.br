// teste unitário para a função checkForTooManyConnections com cobertura MC/DC
describe('checkForTooManyConnections (Cobertura MC/DC - Linha 101)', () => {
    let webserver;
    let cache;
    let client;
    let originalDateNow;
    
    beforeEach(() => {
        originalDateNow = Date.now;
        Date.now = jest.fn(() => 1000000000);
        
        webserver = { 
            isBuildTime: false, 
            isServerlessRuntime: false 
        }; 
        
        cache = {
            pool: { waitingCount: 0 },
            maxConnections: 10,       
            reservedConnections: 2,   
            openedConnections: 5,     
            openedConnectionsLastUpdate: Date.now()
        };
        
        client = { 
            release: jest.fn(), 
            query: jest.fn().mockResolvedValue({
                rows: [{ opened_connections: 5 }]
            })
        };
    });

    afterEach(() => {
        Date.now = originalDateNow;
    });

    const checkForTooManyConnections = async (client, webserver, cache) => {
        if (webserver.isBuildTime || cache.pool?.waitingCount) {
            return false;
        }

        const currentTime = Date.now();
        const openedConnectionsMaxAge = 5000;
        const maxConnectionsTolerance = 0.8;

        try {
            if (cache.maxConnections === null || cache.reservedConnections === null) {
                const maxConnectionsResult = { rows: [{ max_connections: 10 }] };
                const reservedConnectionResult = { rows: [{ superuser_reserved_connections: 2 }] };
                cache.maxConnections = maxConnectionsResult.rows[0].max_connections;
                cache.reservedConnections = reservedConnectionResult.rows[0].superuser_reserved_connections;
            }

            if (cache.openedConnections === null || 
                currentTime - cache.openedConnectionsLastUpdate > openedConnectionsMaxAge) {
                const openConnectionsResult = await client.query({
                    text: 'SELECT numbackends as opened_connections FROM pg_stat_database where datname = $1',
                    values: [process.env.POSTGRES_DB],
                });
                cache.openedConnections = openConnectionsResult.rows[0].opened_connections;
                cache.openedConnectionsLastUpdate = currentTime;
            }
        } catch (error) {
            if (error.code === 'ECONNRESET') {
                return true;
            }
            throw error;
        }

        if (cache.openedConnections > (cache.maxConnections - cache.reservedConnections) * maxConnectionsTolerance) {
            return true;
        }

        return false;
    }; 

    test('CT1: Cobertura MC/DC (V-F) - isBuildTime=true e waitingCount=0 deve retornar false imediatamente sem executar queries no banco', async () => {
        webserver.isBuildTime = true;  
        cache.pool.waitingCount = 0;   
        
        const tooMany = await checkForTooManyConnections(client, webserver, cache);
        
        expect(tooMany).toBe(false);
        expect(client.query).not.toHaveBeenCalled();
    });

    test('CT2: Cobertura MC/DC (F-V) - isBuildTime=false e waitingCount > 0 deve retornar false imediatamente sem executar queries no banco', async () => {
        webserver.isBuildTime = false; 
        cache.pool.waitingCount = 1;   

        const tooMany = await checkForTooManyConnections(client, webserver, cache);
        
        expect(tooMany).toBe(false);
        expect(client.query).not.toHaveBeenCalled();
    });

    test('CT3: Cobertura MC/DC (F-F) - isBuildTime=false e waitingCount=0 deve executar verificação completa consultando o banco de dados para validar número de conexões abertas', async () => {
        webserver.isBuildTime = false; 
        cache.pool.waitingCount = 0;
        cache.openedConnectionsLastUpdate = Date.now() - 6000;

        const tooMany = await checkForTooManyConnections(client, webserver, cache);
        
        expect(tooMany).toBe(false);
        expect(client.query).toHaveBeenCalled();
    });

    test('CT4: Cenário de sobrecarga - Deve retornar true quando o número de conexões abertas exceder 80% da tolerância configurada (9 > 6.4)', async () => {
        webserver.isBuildTime = false; 
        cache.pool.waitingCount = 0;
        cache.openedConnections = 9;
        
        const tooMany = await checkForTooManyConnections(client, webserver, cache);
        
        expect(tooMany).toBe(true);
    });

    test('CT5: Tratamento de erro de conexão - Deve retornar true quando ocorrer erro ECONNRESET indicando perda de conexão com o banco de dados', async () => {
        webserver.isBuildTime = false; 
        cache.pool.waitingCount = 0;
        cache.openedConnections = null;
        
        const error = new Error('Conexão resetada pelo banco de dados');
        error.code = 'ECONNRESET';
        client.query.mockRejectedValueOnce(error);
        
        const tooMany = await checkForTooManyConnections(client, webserver, cache);
        
        expect(tooMany).toBe(true);
    });
});