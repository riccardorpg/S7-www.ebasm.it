<?php

namespace App\Security;

use App\Entity\Slave\User as AgencyUser;
use App\Service\CompanyService;
use Doctrine\DBAL\Exception as DbalException;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

/**
 * Provider degli utenti agenzia (DB slave), al posto dell'entity provider standard.
 *
 * Motivo: la connessione slave punta al database master finché non c'è un tenant. Con un
 * entity provider generico il ripristino da cookie "resta collegato" su sessione scaduta
 * interrogava `eb_s_user` sul master e produceva un errore SQL (500) invece di un
 * semplice "utente non trovato". Qui il tenant è un prerequisito esplicito e qualunque
 * problema di connessione diventa UserNotFoundException: il firewall scarta il cookie e
 * rimanda al login.
 *
 * @implements UserProviderInterface<AgencyUser>
 */
class AgencyUserProvider implements UserProviderInterface, PasswordUpgraderInterface
{
    public function __construct(
        private readonly ManagerRegistry $registry,
        private readonly CompanyService $companyService,
    ) {
    }

    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        // Nessuna agenzia in sessione né nel cookie: non c'è un database su cui cercare.
        if ($this->companyService->currentTenantDbName() === null) {
            throw new UserNotFoundException('Nessun contesto agenzia per "' . $identifier . '".');
        }

        try {
            $user = $this->registry->getManager('slave')
                ->getRepository(AgencyUser::class)
                ->findOneBy(['email' => mb_strtolower($identifier)]);
        } catch (DbalException | \Doctrine\DBAL\Driver\Exception $e) {
            throw new UserNotFoundException('Database agenzia non raggiungibile.', 0, $e);
        }

        if ($user === null) {
            throw new UserNotFoundException('Utente agenzia "' . $identifier . '" non trovato.');
        }

        return $user;
    }

    public function refreshUser(UserInterface $user): UserInterface
    {
        if (!$user instanceof AgencyUser) {
            throw new UnsupportedUserException(sprintf('Utente non gestito: "%s".', $user::class));
        }

        return $this->loadUserByIdentifier($user->getUserIdentifier());
    }

    public function supportsClass(string $class): bool
    {
        return $class === AgencyUser::class || is_subclass_of($class, AgencyUser::class);
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof AgencyUser) {
            return;
        }

        $user->setPassword($newHashedPassword);
        $this->registry->getManager('slave')->flush();
    }
}
