<?php

namespace App\Repository\Slave;

use App\Entity\Slave\Customer;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Customer>
 */
class CustomerRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Customer::class);
    }

    /**
     * Cliente con lo stesso codice fiscale: serve a non duplicare l'anagrafica
     * quando la stessa persona torna in un'altra pratica.
     */
    public function findOneByFiscalCode(string $fiscalCode): ?Customer
    {
        if (trim($fiscalCode) === '') {
            return null;
        }

        return $this->createQueryBuilder('c')
            ->andWhere('UPPER(c.fiscalCode) = :fc')
            ->setParameter('fc', mb_strtoupper(trim($fiscalCode)))
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
