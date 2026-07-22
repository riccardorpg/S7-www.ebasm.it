<?php

namespace App\Repository\Master;

use App\Entity\Master\AgencyUserIndex;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AgencyUserIndex>
 */
class AgencyUserIndexRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AgencyUserIndex::class);
    }

    public function findOneByEmail(string $email): ?AgencyUserIndex
    {
        return $this->findOneBy(['email' => mb_strtolower(trim($email))]);
    }
}
