<?php

namespace App\Repository\Master;

use App\Entity\Master\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function findOneByEmail(string $email): ?User
    {
        return $this->findOneBy(['email' => mb_strtolower(trim($email))]);
    }

    /**
     * 12.2.9 Notai attivi, per cognome: sono i candidati assegnabili a una pratica.
     *
     * @return User[]
     */
    public function findActiveNotaries(): array
    {
        return $this->findBy(
            ['role' => 'ROLE_NOTARY', 'active' => true],
            ['surname' => 'ASC', 'name' => 'ASC'],
        );
    }
}
