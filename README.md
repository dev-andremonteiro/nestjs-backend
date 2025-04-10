<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Descrição

Projeto usando [Nest](https://github.com/nestjs/nest)

## Configuração do Projeto

```bash
$ pnpm install
```

## Compilar e executar o projeto

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run dev

# production mode
$ pnpm run start:prod
```

## Executar testes

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Implantação

### Usando Docker

Este projeto está configurado para ser executado usando Docker e Docker Compose, simplificando a configuração e garantindo consistência entre ambientes.

1.  **Pré-requisitos:** Certifique-se de ter [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/) instalados.

2.  **Variáveis de Ambiente:**
    *   Copie o arquivo de ambiente de exemplo: `cp .env.example .env`
    *   Revise e **atualize** o arquivo `.env` com a configuração desejada.

3.  **Construir e Executar:**
    ```bash
    # Build the images and start the containers in detached mode
    docker-compose up --build -d
    ```
    Este comando irá:
    *   Construir a imagem Docker para a aplicação NestJS usando o `Dockerfile` multi-estágio.
    *   Baixar as imagens `postgres` e `minio`.
    *   Iniciar os contêineres para a aplicação, banco de dados e armazenamento de objetos.
    *   A aplicação aguardará que o banco de dados e o MinIO estejam saudáveis antes de iniciar.

4.  **Aplicar Schema do Banco de Dados:**
    Assim que os contêineres estiverem em execução, aplique o schema do Prisma ao contêiner do banco de dados:
    ```bash
    docker-compose exec app pnpm prisma db push
    ```

5.  **Acessando Serviços:**
    *   **Aplicação:** `http://localhost:<PORT>` (Padrão: `http://localhost:3000`, verifique seu `.env` para `PORT`)
    *   **Console MinIO:** `http://localhost:<MINIO_CONSOLE_PORT>` (Padrão: `http://localhost:9001`)
    *   **PostgreSQL:** Conecte-se usando um cliente em `localhost:<POSTGRES_PORT>` (Padrão: `5432`) com as credenciais do `.env`.

6.  **Parando:**
    ```bash
    # Stop and remove containers, networks, and volumes
    docker-compose down

    # Stop and remove containers/networks, but keep volumes (data)
    # docker-compose down --volumes
    ```

### Manual / Outras Plataformas

Quando estiver pronto para implantar sua aplicação NestJS em produção, existem alguns passos chave que você pode seguir para garantir que ela rode da forma mais eficiente possível. Confira a [documentação de implantação](https://docs.nestjs.com/deployment) para mais informações.

## Recursos

- [Documentação NestJS](https://docs.nestjs.com)

## Licença

[Licenciado sob MIT](https://github.com/nestjs/nest/blob/master/LICENSE).
