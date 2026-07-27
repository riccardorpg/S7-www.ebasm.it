<?php

namespace App\Repository\Master;

use App\Entity\Master\DemoRequest;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DemoRequest>
 */
class DemoRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DemoRequest::class);
    }

    /** 6.1.1 Nuove richieste in arrivo (non ancora evase). */
    public function findPending(): array
    {
        return $this->findBy(['processed' => false], ['createdAt' => 'DESC']);
    }

    public function countPending(): int
    {
        return $this->count(['processed' => false]);
    }
}
