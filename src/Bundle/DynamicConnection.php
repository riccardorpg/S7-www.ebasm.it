<?php

namespace App\Bundle;

use Doctrine\DBAL\Connection;

/**
 * Connessione DBAL "slave" ri-puntabile a runtime.
 *
 * In architettura multi-tenant ogni agenzia (ROLE_AGENCY) ha il proprio database.
 * changeDatabase() chiude l'eventuale connessione aperta e riscrive i parametri di
 * connessione (host/port/user/password/dbname) direttamente nella proprietà privata
 * Connection::$params via reflection: alla query successiva DBAL riapre la connessione
 * verso il database dell'agenzia corrente.
 *
 * Nota DBAL 4: i parametri effettivamente usati dal driver sono host/port/dbname/user/
 * password; la chiave 'url' non viene ri-parsata dopo la costruzione, quindi va tenuta
 * allineata solo per coerenza/debug.
 */
class DynamicConnection extends Connection
{
    public function changeDatabase(string $host, string $port, string $user, string $password, string $dbName): void
    {
        if ($this->isConnected()) {
            $this->close();
        }

        $params = $this->getParams();
        $params['url']      = 'mysql://' . $user . ':' . $password . '@' . $host . ':' . $port . '/' . $dbName;
        $params['host']     = $host;
        $params['port']     = (int) $port;
        $params['dbname']   = $dbName;
        $params['user']     = $user;
        $params['password'] = $password;

        $ref = new \ReflectionProperty(Connection::class, 'params');
        $ref->setValue($this, $params);
    }

    /**
     * Nome del database attualmente puntato dalla connessione (senza aprire connessioni).
     */
    public function getCurrentDatabaseName(): ?string
    {
        return $this->getParams()['dbname'] ?? null;
    }
}
